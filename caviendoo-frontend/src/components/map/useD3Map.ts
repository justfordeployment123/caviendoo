'use client';

import { useCallback } from 'react';
import type { RefObject, MutableRefObject } from 'react';
import * as d3 from 'd3';
import type { ZoomBehavior } from 'd3';

/**
 * Custom hook that provides programmatic zoom controls for the D3 Tunisia map.
 *
 * Accepts the SVG ref and the zoom behaviour ref managed by TunisiaMap's render
 * effect. Returns stable `zoomIn`, `zoomOut`, and `resetZoom` callbacks that
 * operate on that zoom instance.
 *
 * The projection and ResizeObserver logic remain inside TunisiaMap's useEffect
 * because D3 path rendering is tightly coupled to both. Extracting them here
 * would require an additional ResizeObserver and state layer that would trigger
 * extra re-renders without benefit at M1 scale.
 *
 * M2 note: if TunisiaMap is refactored to a fully declarative React + D3
 * pattern, this hook can absorb the full projection + resize logic at that
 * point without changing call sites.
 */
export function useD3Map(
  svgRef: RefObject<SVGSVGElement | null>,
  zoomRef: MutableRefObject<ZoomBehavior<SVGSVGElement, unknown> | null>
) {
  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1.5);
  }, [svgRef, zoomRef]);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 0.67);
  }, [svgRef, zoomRef]);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    // Calling zoom.transform fires the zoom event handler in TunisiaMap,
    // which updates savedTransformRef automatically — no manual reset needed.
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, [svgRef, zoomRef]);

  return { zoomIn, zoomOut, resetZoom };
}
