'use client';

import { useTranslations } from 'next-intl';
import type { OverlayMode } from '@/types';

interface MapLegendProps {
  overlayMode: OverlayMode;
}

// ── Récoltes swatches ──────────────────────────────────────────────────────
const RECOLTES_SWATCHES = [
  { color: '#C8D8A0', label: '0' },
  { color: '#7EAA50', label: '1–6' },
  { color: '#50943A', label: '7–12' },
  { color: '#2E7820', label: '13–19' },
  { color: '#0A4A08', label: '20+' },
];

// ── Stress Hydrique gradient stops ────────────────────────────────────────
const STRESS_STOPS = [
  { color: '#1a6a3a', label: '0%' },
  { color: '#4a8a28', label: '25%' },
  { color: '#a09010', label: '50%' },
  { color: '#d07818', label: '75%' },
  { color: '#a01010', label: '100%' },
];

// ── UV gradient stops ──────────────────────────────────────────────────────
const UV_STOPS = [
  { color: '#f5f0c0', label: '3' },
  { color: '#f0c840', label: '5' },
  { color: '#e08020', label: '7' },
  { color: '#c04010', label: '9' },
  { color: '#801010', label: '11' },
];

function GradientBar({ stops }: { stops: { color: string; label: string }[] }) {
  const gradient = stops
    .map(
      (s, i) => `${s.color} ${Math.round((i / (stops.length - 1)) * 100)}%`
    )
    .join(', ');
  return (
    <div className="flex flex-col gap-1 gradient-bar">
      <div
        className="h-2 rounded-full w-28 sm:w-36"
        style={{ background: `linear-gradient(to right, ${gradient})` }}
      />
      <div className="flex justify-between w-28 sm:w-36">
        {stops.map((s) => (
          <span key={s.label} className="text-2xs text-muted font-mono">
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MapLegend({ overlayMode }: MapLegendProps) {
  const t = useTranslations('overlay');

  return (
    <div className="absolute bottom-4 start-4 z-10 bg-surface/95 border border-border rounded-lg px-3 py-2.5 backdrop-blur-sm shadow-panel-dark">
      <p className="text-2xs text-muted uppercase tracking-widest mb-2 font-medium">
        {overlayMode === 'recoltes' && t('recoltes')}
        {overlayMode === 'stress-hydrique' && t('stressHydrique')}
        {overlayMode === 'indice-uv' && t('indiceUv')}
      </p>

      {overlayMode === 'recoltes' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {RECOLTES_SWATCHES.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-sm border border-ink/15"
                style={{ background: color }}
              />
              <span className="text-2xs text-muted font-mono">{label}</span>
            </div>
          ))}
        </div>
      )}

      {overlayMode === 'stress-hydrique' && (
        <div>
          <GradientBar stops={STRESS_STOPS} />
          <div className="flex justify-between w-28 sm:w-36 mt-0.5">
            <span className="text-2xs text-emerald-700">{t('legendSustainable')}</span>
            <span className="text-2xs text-red-600">{t('legendCritical')}</span>
          </div>
        </div>
      )}

      {overlayMode === 'indice-uv' && (
        <div>
          <GradientBar stops={UV_STOPS} />
          <div className="flex justify-between w-28 sm:w-36 mt-0.5">
            <span className="text-2xs text-amber-700">{t('legendLow')}</span>
            <span className="text-2xs text-red-600">{t('legendExtreme')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
