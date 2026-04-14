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

// Sea and land background colours (Mediterranean basemap feel)
const SEA_COLOR  = '#D4E8F0';
const LAND_COLOR = '#E8EDE4'; // surrounding land (neighbours)

export function TunisiaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const savedTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

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
      if (width < 2 * PAD + 1 || height < 2 * PAD + 1) return;

      const svgSel = d3.select(svg!);
      svgSel.selectAll('*').remove();
      svgSel.attr('width', width).attr('height', height);

      // ── Sea background ───────────────────────────────────────────────
      svgSel.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', SEA_COLOR);

      // ── Surrounding land (a subtle rectangle slightly smaller than SVG)
      // Gives the impression of neighbouring countries without a separate GeoJSON
      svgSel.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', width).attr('height', height)
        .attr('fill', LAND_COLOR)
        .attr('rx', 0);

      const projection = d3.geoMercator().fitExtent(
        [[PAD, PAD], [width - PAD, height - PAD]],
        geojson
      );
      projectionRef.current = projection;

      const pathGen = d3.geoPath().projection(projection);
      const g = svgSel.append('g');

      // Restore zoom position
      g.attr('transform', savedTransformRef.current.toString());

      // Stroke colours for selected vs normal governorates
      const SEL_STROKE   = '#1A2A0A';
      const NORM_STROKE  = 'rgba(26,42,10,0.35)';
      const HOVER_STROKE = '#396809';

      g.append('g')
        .attr('class', 'regions')
        .selectAll('path')
        .data(features)
        .join('path')
        .attr('d', pathGen as never)
        .attr('fill', (d) => {
          const gov = govByNameRef.current.get(d.properties!.shapeName as string);
          return gov ? getGovernorateColor(gov, overlayRef.current) : '#C8D8A0';
        })
        .attr('stroke', (d) =>
          selectedRef.current === d.properties!.shapeName ? SEL_STROKE : NORM_STROKE
        )
        .attr('stroke-width', (d) =>
          selectedRef.current === d.properties!.shapeName ? 2 : 0.7
        )
        .attr('stroke-opacity', (d) =>
          selectedRef.current === d.properties!.shapeName ? 1 : 0.6
        )
        .attr('vector-effect', 'non-scaling-stroke')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          d3.select(this).raise()
            .attr('stroke', HOVER_STROKE)
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
            .attr('stroke', isSel ? SEL_STROKE : NORM_STROKE)
            .attr('stroke-width', isSel ? 2 : 0.7)
            .attr('stroke-opacity', isSel ? 1 : 0.6);
          setTooltipGov(null);
          if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        })
        .on('click', function (event, d) {
          event.stopPropagation();
          const name = d.properties!.shapeName as string;
          const next = selectedRef.current === name ? null : name;
          setSelectedGovernorate(next);

          g.selectAll<SVGPathElement, typeof features[number]>('.regions path')
            .each(function (fd) {
              const fname = fd.properties!.shapeName as string;
              const sel = fname === next;
              d3.select(this)
                .attr('stroke', sel ? SEL_STROKE : NORM_STROKE)
                .attr('stroke-width', sel ? 2 : 0.7)
                .attr('stroke-opacity', sel ? 1 : 0.6);
            });
        });

      // ── Labels — scale proportionally with zoom (grow as user zooms in) ──
      const k = savedTransformRef.current.k;
      // font-size = 8 / k^0.7 so rendered size = 8 * k^0.3 (grows with zoom)
      const labelSize = 8 / Math.pow(k, 0.7);
      const strokeWidth = 2.5 / Math.pow(k, 0.7);

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
        .attr('font-size', labelSize)
        .attr('fill', 'rgba(255,255,255,0.95)')
        .attr('stroke', 'rgba(26,42,10,0.65)')
        .attr('stroke-width', strokeWidth)
        .attr('paint-order', 'stroke')
        .attr('pointer-events', 'none')
        .text((d) => d.properties!.shapeName as string);

      // ── Zoom ──────────────────────────────────────────────────────────
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .on('zoom', (event) => {
          const t = event.transform;
          savedTransformRef.current = t;
          g.attr('transform', t.toString());
          // Labels grow proportionally with zoom
          const ls = 8 / Math.pow(t.k, 0.7);
          const sw = 2.5 / Math.pow(t.k, 0.7);
          g.selectAll('.gov-label')
            .attr('font-size', ls)
            .attr('stroke-width', sw);
        });

      zoomRef.current = zoom;
      svgSel.call(zoom);
      svgSel.call(zoom.transform, savedTransformRef.current);

      svgSel.on('click', () => {
        if (selectedRef.current) setSelectedGovernorate(null);
      });
    }

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 2 * PAD && h > 2 * PAD) render(w, h);

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
      className="relative w-full overflow-hidden select-none"
      style={{ height: '100%', minHeight: 300, touchAction: 'none', background: SEA_COLOR }}
    >
      <svg ref={svgRef} className="block w-full h-full touch-action-none" style={{ touchAction: 'none' }} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-30 pointer-events-none"
        style={{ display: 'none', width: 180 }}
      >
        {tooltipGov && !selectedGovernorate && (
          <MapTooltip governorate={tooltipGov} overlayMode={overlayMode} />
        )}
      </div>

      {/* Click popup */}
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
        <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded text-muted hover:text-ink hover:border-gold transition-colors shadow-sm" aria-label="Zoom in">
          <Plus size={14} />
        </button>
        <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded text-muted hover:text-ink hover:border-gold transition-colors shadow-sm" aria-label="Zoom out">
          <Minus size={14} />
        </button>
        <button onClick={resetZoom} className="w-8 h-8 flex items-center justify-center bg-surface border border-border rounded text-muted hover:text-ink hover:border-gold transition-colors shadow-sm" aria-label="Reset view">
          <Locate size={13} />
        </button>
      </div>
    </div>
  );
}
