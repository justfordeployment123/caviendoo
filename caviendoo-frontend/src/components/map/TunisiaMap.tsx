'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Plus, Minus, Locate } from 'lucide-react';
import { useD3Map } from './useD3Map';
import { MapTooltip } from './MapTooltip';
import { GovernoratePopup } from './GovernoratePopup';
import { MapLegend } from './MapLegend';
import { getGovernorateColor } from './mapColors';
import { useAtlasStore } from '@/store';
import { getGovernorates } from '@/services/dataService';
import type { Governorate } from '@/types';
import geojsonRaw from '@/data/tunisia-governorates.json';

const geojson = geojsonRaw as GeoJSON.FeatureCollection;

// ── GeoJSON uses NAME_EN; governorates.ts uses accented shapeName.
// Map the 5 mismatches so the join key always matches. ────────────────────
const GEO_TO_SHAPE: Record<string, string> = {
  'Beja':     'Béja',
  'Gabes':    'Gabès',
  'Kebili':   'Kébili',
  'Le Kef':   'El Kef',
  'Medenine': 'Médenine',
};

// Pre-process features once at module level: inject shapeName into properties
// so D3 callbacks can always read d.properties.shapeName reliably.
const features = geojson.features.map((f) => ({
  ...f,
  properties: {
    ...f.properties,
    shapeName:
      GEO_TO_SHAPE[f.properties!.NAME_EN as string] ??
      (f.properties!.NAME_EN as string),
  },
}));

const PAD = 32; // px padding inside fitExtent

export function TunisiaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  // Persists zoom position across overlay re-renders
  const savedTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  // Zoom control helpers — delegates to the hook so logic isn't duplicated
  const { zoomIn, zoomOut, resetZoom } = useD3Map(svgRef, zoomRef);

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [tooltipGov, setTooltipGov] = useState<Governorate | null>(null);

  const overlayMode = useAtlasStore((s) => s.overlayMode);
  const selectedGovernorate = useAtlasStore((s) => s.selectedGovernorate);
  const setSelectedGovernorate = useAtlasStore((s) => s.setSelectedGovernorate);

  useEffect(() => { getGovernorates().then(setGovernorates); }, []);

  const govByName = useMemo(() => {
    const m = new Map<string, Governorate>();
    for (const g of governorates) m.set(g.shapeName, g);
    return m;
  }, [governorates]);

  // Stable refs — D3 callbacks always see current values, no stale closures
  const overlayRef = useRef(overlayMode);
  overlayRef.current = overlayMode;
  const govByNameRef = useRef(govByName);
  govByNameRef.current = govByName;
  const selectedRef = useRef(selectedGovernorate);
  selectedRef.current = selectedGovernorate;

  // ── CORE D3 RENDERING ─────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    function render(width: number, height: number) {
      // Need at least 2×PAD + 1 in each dimension for fitExtent to be valid
      if (width < 2 * PAD + 1 || height < 2 * PAD + 1) return;

      const svgSel = d3.select(svg!);
      svgSel.selectAll('*').remove();
      svgSel.attr('width', width).attr('height', height);

      // fitExtent gives PAD breathing room on all sides
      const projection = d3.geoMercator().fitExtent(
        [[PAD, PAD], [width - PAD, height - PAD]],
        geojson
      );
      projectionRef.current = projection;

      const pathGen = d3.geoPath().projection(projection);
      const g = svgSel.append('g');

      // Restore zoom position so overlay/window resize doesn't reset the view
      g.attr('transform', savedTransformRef.current.toString());

      // Single-pass rendering: fill + stroke + events on the same path element.
      // Solid fill = entire polygon interior is the mouse hit target (not just the stroke line).
      g.append('g')
        .attr('class', 'regions')
        .selectAll('path')
        .data(features)
        .join('path')
        .attr('d', pathGen as never)
        .attr('fill', (d) => {
          const gov = govByNameRef.current.get(d.properties!.shapeName as string);
          return gov ? getGovernorateColor(gov, overlayRef.current) : '#141714';
        })
        .attr('stroke', (d) =>
          selectedRef.current === d.properties!.shapeName ? '#e8c97a' : '#f0e6cc'
        )
        .attr('stroke-width', (d) =>
          selectedRef.current === d.properties!.shapeName ? 2 : 0.5
        )
        .attr('stroke-opacity', (d) =>
          selectedRef.current === d.properties!.shapeName ? 1 : 0.4
        )
        .attr('vector-effect', 'non-scaling-stroke')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          // raise() so highlighted stroke renders above neighbours
          d3.select(this).raise()
            .attr('stroke', '#ffd700')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 1);

          const name = d.properties!.shapeName as string;
          setTooltipGov(govByNameRef.current.get(name) ?? null);

          const el = tooltipRef.current;
          const rect = containerRef.current?.getBoundingClientRect();
          if (el && rect) {
            el.style.left = `${Math.min(event.clientX - rect.left + 14, rect.width - 200)}px`;
            el.style.top = `${Math.max(event.clientY - rect.top - 80, 8)}px`;
            el.style.display = 'block';
          }
        })
        .on('mousemove', function (event) {
          const el = tooltipRef.current;
          const rect = containerRef.current?.getBoundingClientRect();
          if (el && rect) {
            el.style.left = `${Math.min(event.clientX - rect.left + 14, rect.width - 200)}px`;
            el.style.top = `${Math.max(event.clientY - rect.top - 80, 8)}px`;
          }
        })
        .on('mouseleave', function (_, d) {
          const name = d.properties!.shapeName as string;
          const isSel = selectedRef.current === name;
          d3.select(this)
            .attr('stroke', isSel ? '#e8c97a' : '#f0e6cc')
            .attr('stroke-width', isSel ? 2 : 0.5)
            .attr('stroke-opacity', isSel ? 1 : 0.4);
          setTooltipGov(null);
          if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        })
        .on('click', function (event, d) {
          event.stopPropagation();
          const name = d.properties!.shapeName as string;
          const next = selectedRef.current === name ? null : name;
          setSelectedGovernorate(next);

          // Sync stroke state on all paths immediately (no React re-render needed)
          g.selectAll<SVGPathElement, typeof features[number]>('.regions path')
            .each(function (fd) {
              const fname = fd.properties!.shapeName as string;
              const sel = fname === next;
              d3.select(this)
                .attr('stroke', sel ? '#e8c97a' : '#f0e6cc')
                .attr('stroke-width', sel ? 2 : 0.5)
                .attr('stroke-opacity', sel ? 1 : 0.4);
            });
        });

      // Labels — pointer-events:none so they never block hover on regions beneath
      const k = savedTransformRef.current.k;
      g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(features)
        .join('text')
        .attr('x', (d) => pathGen.centroid(d as never)[0])
        .attr('y', (d) => pathGen.centroid(d as never)[1])
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('class', 'gov-label')
        .attr('font-size', 8 / k)
        .attr('fill', 'rgba(255,255,255,0.75)')
        .attr('stroke', 'rgba(0,0,0,0.6)')
        .attr('stroke-width', 2.5 / k)
        .attr('paint-order', 'stroke')
        .attr('pointer-events', 'none')
        // ← THE MISSING .text() CALL — was never set before
        .text((d) => d.properties!.shapeName as string);

      // Zoom — restore saved position so resize/re-render doesn't snap view
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .on('zoom', (event) => {
          const t = event.transform;
          savedTransformRef.current = t;
          g.attr('transform', t.toString());
          g.selectAll('.gov-label')
            .attr('font-size', 8 / t.k)
            .attr('stroke-width', 2.5 / t.k);
        });

      zoomRef.current = zoom;
      svgSel.call(zoom);
      svgSel.call(zoom.transform, savedTransformRef.current);

      // Click on empty SVG area deselects
      svgSel.on('click', () => {
        if (selectedRef.current) setSelectedGovernorate(null);
      });
    }

    // Attempt immediate render (works if container is already painted)
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 2 * PAD && h > 2 * PAD) render(w, h);

    // ResizeObserver fires when container gets real dimensions (handles timing race)
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        render(entry.contentRect.width, entry.contentRect.height);
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (svg) d3.select(svg).on('.zoom', null).on('click', null);
    };
  }, [governorates, overlayMode, setSelectedGovernorate]);



  // ── Selected governorate popup ─────────────────────────────────────────
  const selectedGov = selectedGovernorate ? govByName.get(selectedGovernorate) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-canvas overflow-hidden select-none"
      style={{ height: '100%', minHeight: 300 }}
    >
      <svg ref={svgRef} className="block w-full h-full" />

      {/* Tooltip (positioned via DOM ref, no React re-render on hover) */}
      <div
        ref={tooltipRef}
        className="absolute z-30 pointer-events-none"
        style={{ display: 'none', width: 180 }}
      >
        {tooltipGov && !selectedGovernorate && (
          <MapTooltip governorate={tooltipGov} overlayMode={overlayMode} />
        )}
      </div>

      {/* Click popup — reuses stored projection, applies current zoom transform */}
      {selectedGov && (() => {
        const svgEl = svgRef.current;
        const cont = containerRef.current;
        const projection = projectionRef.current;
        if (!svgEl || !cont || !projection) return null;
        const feature = features.find(f => f.properties!.shapeName === selectedGovernorate);
        if (!feature) return null;
        const pathGen = d3.geoPath().projection(projection);
        const centroid = pathGen.centroid(feature as never);
        const [sx, sy] = d3.zoomTransform(svgEl).apply(centroid as [number, number]);
        return (
          <GovernoratePopup
            governorate={selectedGov}
            cx={sx}
            cy={sy}
            containerWidth={cont.clientWidth}
            containerHeight={cont.clientHeight}
          />
        );
      })()}

      <MapLegend overlayMode={overlayMode} />

      {/* Zoom controls */}
      <div className="absolute top-4 start-4 z-10 flex flex-col gap-1">
        <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded text-muted hover:text-cream hover:border-gold/50 transition-colors" aria-label="Zoom in">
          <Plus size={14} />
        </button>
        <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded text-muted hover:text-cream hover:border-gold/50 transition-colors" aria-label="Zoom out">
          <Minus size={14} />
        </button>
        <button onClick={resetZoom} className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded text-muted hover:text-cream hover:border-gold/50 transition-colors" aria-label="Reset view">
          <Locate size={13} />
        </button>
      </div>
    </div>
  );
}
