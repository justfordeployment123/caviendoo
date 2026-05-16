'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Lock, Globe, Leaf, X, MapPin } from 'lucide-react';
import type { Topology } from 'topojson-specification';

interface CountryFeature extends GeoJSON.Feature {
  properties: { name: string; [key: string]: unknown };
}

const UNLOCKED_COUNTRIES = new Set(['Tunisia']);

const SEA_COLOR       = '#0d1514';
const LAND_LOCKED     = '#1a2419';
const LAND_UNLOCKED   = '#2d6a2e';
const LAND_HOVER_UN   = '#3d8f3e';
const LAND_HOVER_LK   = '#222d21';
const BORDER_ALL      = 'rgba(255,255,255,0.12)';
const BORDER_UNLOCK   = 'rgba(201,168,76,0.6)';
const STROKE_HOVER    = 'rgba(201,168,76,0.7)';
const STROKE_SELECTED = 'rgba(201,168,76,1.0)';
const GRATICULE_COLOR = 'rgba(255,255,255,0.025)';

// Module-level cache — not re-fetched on resize or re-render
let topoCache: Topology | null = null;

interface WorldMapProps {
  onUnlockClick: (countryName: string) => void;
  metrics?: { totalFruits: number; totalGovernorates: number };
}

export function WorldMap({ onUnlockClick, metrics }: WorldMapProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const svgRef          = useRef<SVGSVGElement>(null);
  const gRef            = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const pathGenRef      = useRef<d3.GeoPath | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const sizeRef         = useRef({ width: 0, height: 0 });
  const transitionRef   = useRef(false);
  const selectedRef     = useRef<string | null>(null);
  const onUnlockRef     = useRef(onUnlockClick);
  const featuresRef     = useRef<CountryFeature[]>([]);

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => { onUnlockRef.current = onUnlockClick; }, [onUnlockClick]);

  // ── Stable helpers (read from refs, no deps) ──────────────────────────────────

  const highlightCountry = useCallback((name: string | null) => {
    const g = gRef.current;
    if (!g) return;
    g.selectAll<SVGPathElement, CountryFeature>('path')
      .attr('stroke', d => {
        const n = d.properties?.name ?? '';
        if (n === name) return STROKE_SELECTED;
        return UNLOCKED_COUNTRIES.has(n) ? BORDER_UNLOCK : BORDER_ALL;
      })
      .attr('stroke-width', d => {
        const n = d.properties?.name ?? '';
        if (n === name) return 2;
        return UNLOCKED_COUNTRIES.has(n) ? 1.2 : 0.5;
      });
  }, []);

  const zoomToFeature = useCallback((feature: CountryFeature, animated = true) => {
    const svg     = svgRef.current;
    const zoom    = zoomBehaviorRef.current;
    const pathGen = pathGenRef.current;
    const { width, height } = sizeRef.current;
    if (!svg || !zoom || !pathGen) return;

    const c = pathGen.centroid(feature as any) as [number, number];
    if (isNaN(c[0])) return;

    const scale = 2.5;
    const tx    = width  / 2 - scale * c[0];
    const ty    = height / 2 - scale * c[1];
    const target = d3.zoomIdentity.translate(tx, ty).scale(scale);

    if (animated) {
      transitionRef.current = true;
      d3.select(svg)
        .transition().duration(550).ease(d3.easeCubicInOut)
        .call(zoom.transform, target)
        .on('end', () => { transitionRef.current = false; });
    } else {
      d3.select(svg).call(zoom.transform, target);
    }
  }, []);

  const zoomReset = useCallback(() => {
    const svg  = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;
    transitionRef.current = true;
    d3.select(svg)
      .transition().duration(450).ease(d3.easeCubicInOut)
      .call(zoom.transform, d3.zoomIdentity)
      .on('end', () => { transitionRef.current = false; });
  }, []);

  const closePanel = useCallback(() => {
    selectedRef.current = null;
    setSelectedCountry(null);
    highlightCountry(null);
    zoomReset();
  }, [highlightCountry, zoomReset]);

  const handleCountryClick = useCallback((name: string, feature: CountryFeature) => {
    if (transitionRef.current) return;

    if (selectedRef.current === name) {
      closePanel();
      return;
    }

    selectedRef.current = name;
    setSelectedCountry(name);
    highlightCountry(name);
    zoomToFeature(feature);
  }, [closePanel, highlightCountry, zoomToFeature]);

  // Escape key closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedRef.current) closePanel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closePanel]);

  // ── Map render ────────────────────────────────────────────────────────────────

  const renderMap = useCallback(async (width: number, height: number) => {
    const svg = svgRef.current;
    if (!svg || width < 10 || height < 10) return;
    sizeRef.current = { width, height };

    try {
      if (!topoCache) {
        const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        if (!res.ok) throw new Error('Failed to load world map data');
        topoCache = await res.json() as Topology;
      }

      setLoading(false);

      const topoAny     = topoCache as any;
      const countries   = topojson.feature(topoAny, topoAny.objects['countries']) as unknown as GeoJSON.FeatureCollection;
      const featuresArr = countries.features as CountryFeature[];
      featuresRef.current = featuresArr;

      const svgSel = d3.select(svg);
      svgSel.selectAll('*').remove();
      svgSel.attr('width', width).attr('height', height);

      const projection = d3.geoNaturalEarth1()
        .fitExtent([[16, 16], [width - 16, height - 16]], { type: 'Sphere' });
      const pathGen = d3.geoPath().projection(projection);
      pathGenRef.current = pathGen;

      // Zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 12])
        .on('zoom', (event) => { gRef.current?.attr('transform', event.transform); });
      zoomBehaviorRef.current = zoom;
      svgSel.call(zoom);

      // Click ocean → deselect
      svgSel.on('click', () => { if (selectedRef.current) closePanel(); });

      // ── Defs ──────────────────────────────────────────────────────────────────
      const defs = svgSel.append('defs');
      const glowF = defs.append('filter')
        .attr('id', 'tunisia-glow')
        .attr('x', '-150%').attr('y', '-150%')
        .attr('width', '400%').attr('height', '400%');
      glowF.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '7');

      // ── Background ────────────────────────────────────────────────────────────
      svgSel.append('rect').attr('width', width).attr('height', height).attr('fill', SEA_COLOR);
      svgSel.append('path')
        .datum({ type: 'Sphere' } as unknown as GeoJSON.GeoJsonObject)
        .attr('d', pathGen as any)
        .attr('fill', SEA_COLOR)
        .attr('stroke', 'rgba(255,255,255,0.06)').attr('stroke-width', 0.5);

      // ── Graticule ─────────────────────────────────────────────────────────────
      svgSel.append('path')
        .datum(d3.geoGraticule().step([30, 30])())
        .attr('d', pathGen as any)
        .attr('fill', 'none').attr('stroke', GRATICULE_COLOR).attr('stroke-width', 0.5);

      // ── Tunisia glow ──────────────────────────────────────────────────────────
      const tunisiaFeature = featuresArr.find(f => f.properties?.name === 'Tunisia');
      if (tunisiaFeature) {
        svgSel.append('path')
          .datum(tunisiaFeature)
          .attr('d', pathGen as any)
          .attr('fill', 'rgba(201,168,76,0.45)').attr('stroke', 'none')
          .attr('filter', 'url(#tunisia-glow)').attr('pointer-events', 'none');
      }

      // ── Countries ─────────────────────────────────────────────────────────────
      const g = svgSel.append('g');
      gRef.current = g;

      g.selectAll('path')
        .data(featuresArr)
        .join('path')
        .attr('d', pathGen as any)
        .attr('fill',         d => UNLOCKED_COUNTRIES.has(d.properties?.name ?? '') ? LAND_UNLOCKED : LAND_LOCKED)
        .attr('stroke',       d => UNLOCKED_COUNTRIES.has(d.properties?.name ?? '') ? BORDER_UNLOCK : BORDER_ALL)
        .attr('stroke-width', d => UNLOCKED_COUNTRIES.has(d.properties?.name ?? '') ? 1.2 : 0.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function(_, d) {
          const name = d.properties?.name as string ?? '';
          setHoveredCountry(name);
          if (name !== selectedRef.current) {
            d3.select(this)
              .attr('fill', UNLOCKED_COUNTRIES.has(name) ? LAND_HOVER_UN : LAND_HOVER_LK)
              .attr('stroke', STROKE_HOVER)
              .attr('stroke-width', 0.9);
          }
        })
        .on('mouseleave', function(_, d) {
          const name = d.properties?.name as string ?? '';
          setHoveredCountry(null);
          if (name !== selectedRef.current) {
            d3.select(this)
              .attr('fill',         UNLOCKED_COUNTRIES.has(name) ? LAND_UNLOCKED : LAND_LOCKED)
              .attr('stroke',       UNLOCKED_COUNTRIES.has(name) ? BORDER_UNLOCK : BORDER_ALL)
              .attr('stroke-width', UNLOCKED_COUNTRIES.has(name) ? 1.2 : 0.5);
          }
        })
        .on('click', (event, d) => {
          event.stopPropagation();
          const name = d.properties?.name as string ?? '';
          handleCountryClick(name, d);
        });

      // ── Tunisia marker ────────────────────────────────────────────────────────
      if (tunisiaFeature) {
        const c = pathGen.centroid(tunisiaFeature as any);
        if (!isNaN(c[0])) {
          const [cx, cy] = c;

          const ring = g.append('circle')
            .attr('cx', cx).attr('cy', cy).attr('r', 8)
            .attr('fill', 'none').attr('stroke', 'rgba(201,168,76,0.55)').attr('stroke-width', 1.5)
            .attr('pointer-events', 'none');
          ring.append('animate')
            .attr('attributeName', 'r').attr('from', '8').attr('to', '28').attr('dur', '1.8s').attr('repeatCount', 'indefinite');
          ring.append('animate')
            .attr('attributeName', 'opacity').attr('from', '0.9').attr('to', '0').attr('dur', '1.8s').attr('repeatCount', 'indefinite');

          g.append('circle')
            .attr('cx', cx).attr('cy', cy).attr('r', 4)
            .attr('fill', '#c9a84c').attr('stroke', '#f2ead8').attr('stroke-width', 1.5)
            .attr('pointer-events', 'none');

          g.append('text')
            .attr('x', cx + 9).attr('y', cy + 4)
            .attr('font-size', 11).attr('font-family', "'DM Sans', sans-serif").attr('font-weight', 600)
            .attr('fill', '#c9a84c').attr('stroke', '#0d0f0e').attr('stroke-width', 3).attr('paint-order', 'stroke')
            .attr('pointer-events', 'none')
            .text('Tunisia ›');
        }
      }

      // ── Restore selection state after re-render (e.g. resize) ─────────────────
      const currentSel = selectedRef.current;
      if (currentSel) {
        highlightCountry(currentSel);
        const selFeature = featuresArr.find(f => f.properties?.name === currentSel);
        if (selFeature) zoomToFeature(selFeature, false);
      }

    } catch (err) {
      console.error('[WorldMap] render error:', err);
      setError(true);
      setLoading(false);
    }
  }, [handleCountryClick, closePanel, highlightCountry, zoomToFeature]);

  // ── Resize observer (debounced) ───────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    const svg       = svgRef.current;
    if (!container || !svg) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const { clientWidth: w, clientHeight: h } = container;
    if (w > 40 && h > 40) renderMap(w, h);

    const ro = new ResizeObserver((entries) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const r = entries[entries.length - 1].contentRect;
        renderMap(r.width, r.height);
      }, 150);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (timer) clearTimeout(timer);
      if (svg) d3.select(svg).selectAll('*').remove();
    };
  }, [renderMap]);

  const isTunisia = selectedCountry ? UNLOCKED_COUNTRIES.has(selectedCountry) : false;
  const panelOpen = !!selectedCountry;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden"
      style={{ background: SEA_COLOR }}
    >
      <svg ref={svgRef} className="block w-full h-full" style={{ touchAction: 'none' }} />

      {/* Loading — light text on dark map */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
          <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>Loading world map…</p>
        </div>
      )}

      {/* Error — light text on dark map */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <Globe size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>World map could not be loaded.</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Check your internet connection and reload.</p>
        </div>
      )}

      {/* Hover tooltip — always dark bg + white text since it floats over the dark map */}
      {hoveredCountry && hoveredCountry !== selectedCountry && !loading && (
        <div className="absolute top-3 start-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 shadow-lg whitespace-nowrap"
            style={{
              background: 'rgba(10,16,12,0.88)',
              border: UNLOCKED_COUNTRIES.has(hoveredCountry)
                ? '1px solid rgba(201,168,76,0.5)'
                : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {UNLOCKED_COUNTRIES.has(hoveredCountry)
              ? <Leaf size={11} style={{ color: '#c9a84c' }} className="shrink-0" />
              : <MapPin size={11} style={{ color: 'rgba(255,255,255,0.5)' }} className="shrink-0" />
            }
            <span
              className="text-xs font-medium"
              style={{ color: UNLOCKED_COUNTRIES.has(hoveredCountry) ? '#c9a84c' : 'rgba(255,255,255,0.8)' }}
            >
              {hoveredCountry}
            </span>
          </div>
        </div>
      )}

      {/* Legend — dark bg + white text, floats over dark map */}
      {!loading && !error && !panelOpen && (
        <div className="absolute bottom-3 start-3 z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.625rem' }}>
            <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: LAND_UNLOCKED, border: `1px solid ${BORDER_UNLOCK}` }} />
            <span>Available region</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.625rem' }}>
            <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: LAND_LOCKED, border: `1px solid ${BORDER_ALL}` }} />
            <span>Coming soon</span>
          </div>
        </div>
      )}

      {/* ── Country info panel ─────────────────────────────────────────────────── */}
      {/* Fully opaque parchment panel — no backdrop-blur bleeding dark map colors  */}
      {/* Desktop: slides in from right  |  Mobile: slides up from bottom           */}
      <div
        className={[
          'absolute z-30 shadow-2xl',
          'transition-transform duration-300 ease-out',
          // Desktop: wider panel
          'sm:top-0 sm:end-0 sm:h-full sm:w-96 sm:rounded-none',
          // Mobile: full width, taller sheet
          'max-sm:bottom-0 max-sm:inset-x-0 max-sm:rounded-t-2xl',
          // Visibility
          panelOpen
            ? 'sm:translate-x-0 max-sm:translate-y-0 pointer-events-auto'
            : 'sm:translate-x-full max-sm:translate-y-full pointer-events-none',
        ].join(' ')}
        style={{
          background: '#F7FBF0',
          borderLeft: '1px solid #C8E08A',
          borderTop: '1px solid #C8E08A',
        }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: '#C8E08A' }} />
        </div>

        <div className="flex flex-col h-full max-sm:max-h-[80vh]">

          {/* Header */}
          <div
            className="flex items-start justify-between px-5 pt-4 pb-3 sm:pt-5 shrink-0"
            style={{ borderBottom: '1px solid #C8E08A', background: '#EBF5D6' }}
          >
            <div className="flex items-center gap-2.5">
              {isTunisia
                ? <Leaf size={16} className="shrink-0 mt-0.5" style={{ color: '#396809' }} />
                : <Lock size={16} className="shrink-0 mt-0.5" style={{ color: '#6a8050' }} />
              }
              <div>
                <h3 className="font-serif font-bold leading-tight" style={{ color: '#1A2A0A', fontSize: '1.1rem' }}>
                  {selectedCountry}
                </h3>
                <span
                  className="inline-block mt-1 text-2xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: isTunisia ? '#396809' : '#7a9060' }}
                >
                  {isTunisia ? 'Available now' : 'Coming soon'}
                </span>
              </div>
            </div>
            <button
              onClick={closePanel}
              className="transition-colors p-1 -me-1 mt-0.5 rounded shrink-0"
              style={{ color: '#4A6820' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1A2A0A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4A6820')}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isTunisia ? (
              <>
                <p className="text-xs leading-relaxed" style={{ color: '#4A6820' }}>
                  Explore Tunisia's agricultural fruit intelligence — water stress, UV index, harvest seasons, and more across all 24 governorates.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: metrics?.totalFruits        ?? 73, label: 'Fruits'     },
                    { value: metrics?.totalGovernorates  ?? 24, label: 'Regions'    },
                    { value: 3,                                  label: 'Languages'  },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="rounded-lg p-2.5 text-center"
                      style={{ background: '#EBF5D6', border: '1px solid #C8E08A' }}
                    >
                      <p className="font-mono font-bold text-lg leading-none" style={{ color: '#396809' }}>{value}</p>
                      <p className="text-2xs mt-1" style={{ color: '#4A6820' }}>{label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onUnlockRef.current('Tunisia')}
                  className="w-full flex items-center justify-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm text-white"
                  style={{ background: '#396809' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2a5007')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#396809')}
                >
                  <Leaf size={14} />
                  Explore Tunisia Atlas
                </button>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed" style={{ color: '#4A6820' }}>
                  Agricultural intelligence data for{' '}
                  <span style={{ color: '#1A2A0A', fontWeight: 600 }}>{selectedCountry}</span>{' '}
                  is currently in development. Caviendoo is expanding region by region.
                </p>

                <div
                  className="flex items-start gap-2.5 p-3 rounded-lg"
                  style={{ background: '#EBF5D6', border: '1px solid #C8E08A' }}
                >
                  <Lock size={13} className="shrink-0 mt-0.5" style={{ color: '#7a9060' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#1A2A0A' }}>Not yet available</p>
                    <p className="text-2xs mt-0.5 leading-relaxed" style={{ color: '#6a8050' }}>
                      Check back as new regions are added in future releases.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
