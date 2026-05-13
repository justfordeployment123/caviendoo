'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Lock, Globe, Leaf } from 'lucide-react';
import type { Topology } from 'topojson-specification';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CountryFeature extends GeoJSON.Feature {
  properties: {
    name: string;
    [key: string]: unknown;
  };
}

// Countries that are "unlocked" (have data in Caviendoo)
const UNLOCKED_COUNTRIES = new Set(['Tunisia']);

// ── Design tokens matching the project palette ─────────────────────────────

const SEA_COLOR      = '#0d1514';          // near-canvas dark
const LAND_LOCKED    = '#1e2820';          // very dark muted green
const LAND_UNLOCKED  = '#2d6a2e';          // rich active green
const LAND_HOVER     = '#3d8f3e';          // lighter on hover
const BORDER_LOCKED  = 'rgba(255,255,255,0.04)';
const BORDER_UNLOCK  = 'rgba(201,168,76,0.6)';  // gold border for Tunisia
const STROKE_HOVER   = 'rgba(201,168,76,0.9)';

// ── World map component ────────────────────────────────────────────────────────

interface WorldMapProps {
  /** Called when user clicks an unlocked country */
  onUnlockClick: (countryName: string) => void;
}

export function WorldMap({ onUnlockClick }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Load world GeoJSON from CDN (lightweight 110m natural earth)
  const renderMap = useCallback(async (width: number, height: number) => {
    const svg = svgRef.current;
    if (!svg || width < 10 || height < 10) return;

    try {
      // world-atlas from jsdelivr — countries-110m.json is ~100KB gzipped
      const topoRes = await fetch(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
      );
      if (!topoRes.ok) throw new Error('Failed to load world map data');

      const topo = await topoRes.json() as Topology;

      // Convert topojson → GeoJSON using the topojson-client package
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topoAny = topo as any;
      const countries = topojson.feature(
        topoAny,
        topoAny.objects['countries'],
      ) as unknown as GeoJSON.FeatureCollection;

      setLoading(false);

      const svgSel = d3.select(svg);
      svgSel.selectAll('*').remove();
      svgSel.attr('width', width).attr('height', height);

      // Sea background
      svgSel.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', SEA_COLOR);

      const projection = d3.geoNaturalEarth1()
        .fitExtent([[20, 20], [width - 20, height - 20]], { type: 'Sphere' });

      const pathGen = d3.geoPath().projection(projection);

      // Sphere (ocean outline)
      svgSel.append('path')
        .datum({ type: 'Sphere' } as unknown as GeoJSON.GeoJsonObject)
        .attr('d', pathGen as any)
        .attr('fill', SEA_COLOR)
        .attr('stroke', 'rgba(255,255,255,0.06)')
        .attr('stroke-width', 0.5);

      const g = svgSel.append('g');

      const featuresArr = countries.features as CountryFeature[];

      g.selectAll('path')
        .data(featuresArr)
        .join('path')
        .attr('d', pathGen as any)
        .attr('fill', (d) => {
          const name = d.properties?.name as string ?? '';
          return UNLOCKED_COUNTRIES.has(name) ? LAND_UNLOCKED : LAND_LOCKED;
        })
        .attr('stroke', (d) => {
          const name = d.properties?.name as string ?? '';
          return UNLOCKED_COUNTRIES.has(name) ? BORDER_UNLOCK : BORDER_LOCKED;
        })
        .attr('stroke-width', (d) => {
          const name = d.properties?.name as string ?? '';
          return UNLOCKED_COUNTRIES.has(name) ? 1.2 : 0.4;
        })
        .style('cursor', (d) => {
          const name = d.properties?.name as string ?? '';
          return UNLOCKED_COUNTRIES.has(name) ? 'pointer' : 'default';
        })
        .on('mouseenter', function(_, d) {
          const name = d.properties?.name as string ?? '';
          setHoveredCountry(name);
          if (UNLOCKED_COUNTRIES.has(name)) {
            d3.select(this)
              .attr('fill', LAND_HOVER)
              .attr('stroke', STROKE_HOVER)
              .attr('stroke-width', 2);
          }
        })
        .on('mouseleave', function(_, d) {
          const name = d.properties?.name as string ?? '';
          setHoveredCountry(null);
          d3.select(this)
            .attr('fill', UNLOCKED_COUNTRIES.has(name) ? LAND_UNLOCKED : LAND_LOCKED)
            .attr('stroke', UNLOCKED_COUNTRIES.has(name) ? BORDER_UNLOCK : BORDER_LOCKED)
            .attr('stroke-width', UNLOCKED_COUNTRIES.has(name) ? 1.2 : 0.4);
        })
        .on('click', (_, d) => {
          const name = d.properties?.name as string ?? '';
          if (UNLOCKED_COUNTRIES.has(name)) {
            onUnlockClick(name);
          }
        });

      // "Tunisia" label + glow pulse ring
      const tunisiaFeature = featuresArr.find(
        (f) => f.properties?.name === 'Tunisia',
      );
      if (tunisiaFeature) {
        const centroid = pathGen.centroid(tunisiaFeature as any);
        if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
          // Outer glow ring
          g.append('circle')
            .attr('cx', centroid[0])
            .attr('cy', centroid[1])
            .attr('r', 18)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(201,168,76,0.35)')
            .attr('stroke-width', 1.5)
            .attr('class', 'animate-ping')
            .style('transform-origin', `${centroid[0]}px ${centroid[1]}px`);

          g.append('circle')
            .attr('cx', centroid[0])
            .attr('cy', centroid[1])
            .attr('r', 5)
            .attr('fill', '#c9a84c')
            .attr('stroke', '#f2ead8')
            .attr('stroke-width', 1);

          // Label
          g.append('text')
            .attr('x', centroid[0] + 10)
            .attr('y', centroid[1] + 4)
            .attr('font-size', 11)
            .attr('font-family', "'DM Sans', sans-serif")
            .attr('font-weight', 600)
            .attr('fill', '#c9a84c')
            .attr('stroke', '#0d0f0e')
            .attr('stroke-width', 3)
            .attr('paint-order', 'stroke')
            .text('Tunisia ›');
        }
      }

    } catch (err) {
      console.error('[WorldMap] render error:', err);
      setError(true);
      setLoading(false);
    }
  }, [onUnlockClick]);

  useEffect(() => {
    const container = containerRef.current;
    const svg       = svgRef.current;
    if (!container || !svg) return;

    let rendered = false;

    const draw = (w: number, h: number) => {
      if (!rendered) {
        rendered = true;
        renderMap(w, h);
      }
    };

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 40 && h > 40) draw(w, h);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        rendered = false;
        draw(entry.contentRect.width, entry.contentRect.height);
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (svg) d3.select(svg).selectAll('*').remove();
    };
  }, [renderMap]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden"
      style={{ background: SEA_COLOR }}
    >
      <svg
        ref={svgRef}
        className="block w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Loading spinner */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <p className="text-xs text-muted font-mono">Loading world map…</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <Globe size={32} className="text-muted opacity-40" />
          <p className="text-sm text-muted">World map could not be loaded.</p>
          <p className="text-xs text-muted/60">Check your internet connection and reload.</p>
        </div>
      )}

      {/* Hover tooltip for locked countries */}
      {hoveredCountry && !UNLOCKED_COUNTRIES.has(hoveredCountry) && (
        <div className="absolute top-4 start-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="flex items-center gap-1.5 bg-surface/90 border border-border rounded-md px-3 py-1.5 shadow-lg backdrop-blur-sm">
            <Lock size={11} className="text-muted shrink-0" />
            <span className="text-xs text-muted">{hoveredCountry} — coming soon</span>
          </div>
        </div>
      )}

      {/* Hover tooltip for Tunisia */}
      {hoveredCountry && UNLOCKED_COUNTRIES.has(hoveredCountry) && (
        <div className="absolute top-4 start-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="flex items-center gap-1.5 bg-surface/90 border border-gold/50 rounded-md px-3 py-1.5 shadow-lg backdrop-blur-sm">
            <Leaf size={11} className="text-gold shrink-0" />
            <span className="text-xs text-gold font-medium">Click to explore Tunisia's fruit atlas</span>
          </div>
        </div>
      )}

      {/* Bottom legend */}
      {!loading && !error && (
        <div className="absolute bottom-4 start-4 z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-2xs text-muted">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: LAND_UNLOCKED, border: `1px solid ${BORDER_UNLOCK}` }} />
            <span>Available region</span>
          </div>
          <div className="flex items-center gap-2 text-2xs text-muted">
            <span className="inline-block w-3 h-3 rounded-sm flex items-center justify-center" style={{ background: LAND_LOCKED, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Lock size={7} className="text-muted/60" />
            </span>
            <span>Coming soon</span>
          </div>
        </div>
      )}
    </div>
  );
}
