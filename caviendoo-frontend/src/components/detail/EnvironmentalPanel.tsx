'use client';

import { useTranslations } from 'next-intl';
import { useAtlasStore } from '@/store';
import type { FruitEnvironmental } from '@/types';

// ── Aquifer circular gauge ─────────────────────────────────────────────────

const R = 20;
const CIRCUMFERENCE = 2 * Math.PI * R;

function AquiferGauge({ pct }: { pct: number }) {
  const arc = (pct / 100) * CIRCUMFERENCE;
  const color =
    pct < 40 ? '#16a34a' : pct < 70 ? '#ca8a04' : '#dc2626';

  return (
    <svg width={52} height={52} viewBox="0 0 52 52" className="shrink-0">
      {/* Track */}
      <circle
        cx={26} cy={26} r={R}
        fill="none"
        stroke="rgba(26,42,10,0.12)"
        strokeWidth={5}
      />
      {/* Progress arc */}
      <circle
        cx={26} cy={26} r={R}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      {/* Centre label */}
      <text
        x={26} y={30}
        textAnchor="middle"
        fontSize={10}
        fontFamily="'JetBrains Mono', monospace"
        fill={color}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── UV range bar ───────────────────────────────────────────────────────────

const UV_COLORS: [number, string][] = [
  [3,  '#65a30d'],
  [6,  '#ca8a04'],
  [8,  '#ea580c'],
  [11, '#dc2626'],
];

function uvBarColor(uv: number): string {
  for (const [threshold, color] of UV_COLORS) {
    if (uv <= threshold) return color;
  }
  return '#7c3aed';
}

function UVBar({ uvMin, uvMax, uvPeak }: { uvMin: number; uvMax: number; uvPeak: number }) {
  const MAX_UV = 12;
  const minPct = ((uvMin - 1) / (MAX_UV - 1)) * 100;
  const widthPct = ((uvMax - uvMin) / (MAX_UV - 1)) * 100;
  const peakPct = ((uvPeak - 1) / (MAX_UV - 1)) * 100;
  const barColor = uvBarColor(uvPeak);

  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-ink/10 overflow-visible">
        <div
          className="absolute top-0 h-2 rounded-full opacity-50"
          style={{ left: `${minPct}%`, width: `${widthPct}%`, backgroundColor: barColor }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface"
          style={{ left: `calc(${peakPct}% - 5px)`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {[1, 3, 6, 8, 11].map((v) => (
          <span key={v} className="text-2xs font-mono text-ink/80">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Water row ─────────────────────────────────────────────────────────────

function WaterRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-ink/90">{label}</span>
      <span className="font-mono text-xs text-ink">{value.toLocaleString()} L/kg</span>
    </div>
  );
}

// ── Sustainability chip ────────────────────────────────────────────────────

const SUSTAINABILITY_STYLES = {
  low:      'bg-emerald-100 border-emerald-400 text-emerald-800',
  moderate: 'bg-amber-100 border-amber-400 text-amber-800',
  high:     'bg-red-100 border-red-400 text-red-800',
};

// ── Main panel ─────────────────────────────────────────────────────────────

export function EnvironmentalPanel({ env }: { env: FruitEnvironmental }) {
  const t = useTranslations('environmental');
  const locale = useAtlasStore((s) => s.locale);

  return (
    <div className="px-4 pb-4">
      <p className="text-2xs text-ink/90 uppercase tracking-wider mb-3 font-medium">
        {t('title')}
      </p>

      <div className="flex flex-col gap-4">
        {/* Water footprint */}
        <div>
          <p className="text-xs text-ink/90 mb-1.5 font-medium">{t('waterFootprint')}</p>
          <div className="flex flex-col gap-1 bg-surface-raised rounded-md px-3 py-2">
            <WaterRow label={t('blueWater')} value={env.blueWaterLkg} />
            <WaterRow label={t('greenWater')} value={env.greenWaterLkg} />
            <div className="border-t border-border mt-1 pt-1">
              <WaterRow label={t('totalWater')} value={env.totalWaterLkg} />
            </div>
          </div>
        </div>

        {/* Aquifer stress gauge */}
        <div>
          <p className="text-xs text-ink/90 mb-1.5 font-medium">{t('aquiferStress')}</p>
          <div className="flex items-center gap-3">
            <AquiferGauge pct={env.aquiferStressPct} />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm text-ink font-semibold">
                {env.aquiferStressPct}%
              </span>
              <span
                className={[
                  'badge border text-2xs',
                  SUSTAINABILITY_STYLES[env.sustainabilityClass],
                ].join(' ')}
              >
                {t(`sustainability_${env.sustainabilityClass}`)}
              </span>
            </div>
          </div>
        </div>

        {/* UV index */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-ink/90 font-medium">{t('uvIndex')}</p>
            <span className="font-mono text-xs text-ink-muted">
              {t('uvRange', { min: env.uvMin, max: env.uvMax })}
            </span>
          </div>
          <UVBar uvMin={env.uvMin} uvMax={env.uvMax} uvPeak={env.uvPeak} />
          {env.uvNote && (
            <p className="text-2xs text-ink/90 mt-1.5 leading-relaxed">
              {typeof env.uvNote === 'string' ? env.uvNote : env.uvNote[locale]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
