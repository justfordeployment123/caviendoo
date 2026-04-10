'use client';

import { useTranslations } from 'next-intl';
import type { FruitEnvironmental } from '@/types';

// ── Aquifer circular gauge ─────────────────────────────────────────────────

const R = 20;
const CIRCUMFERENCE = 2 * Math.PI * R;

function AquiferGauge({ pct }: { pct: number }) {
  const arc = (pct / 100) * CIRCUMFERENCE;

  // Colour ramp: green → yellow → red
  const color =
    pct < 40 ? '#4ade80' : pct < 70 ? '#facc15' : '#f87171';

  return (
    <svg width={52} height={52} viewBox="0 0 52 52" className="shrink-0">
      {/* Track */}
      <circle
        cx={26} cy={26} r={R}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={5}
      />
      {/* Progress arc — starts at 12 o'clock (-90°) */}
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
  [3,  '#a3e635'], // low
  [6,  '#facc15'], // moderate
  [8,  '#f97316'], // high
  [11, '#dc2626'], // very high
];

function uvBarColor(uv: number): string {
  for (const [threshold, color] of UV_COLORS) {
    if (uv <= threshold) return color;
  }
  return '#7c3aed'; // extreme
}

function UVBar({ uvMin, uvMax, uvPeak }: { uvMin: number; uvMax: number; uvPeak: number }) {
  const MAX_UV = 12;
  const minPct = ((uvMin - 1) / (MAX_UV - 1)) * 100;
  const widthPct = ((uvMax - uvMin) / (MAX_UV - 1)) * 100;
  const peakPct = ((uvPeak - 1) / (MAX_UV - 1)) * 100;
  const barColor = uvBarColor(uvPeak);

  return (
    <div className="w-full">
      {/* Track */}
      <div className="relative h-2 rounded-full bg-white/8 overflow-visible">
        {/* Range fill */}
        <div
          className="absolute top-0 h-2 rounded-full opacity-40"
          style={{
            left: `${minPct}%`,
            width: `${widthPct}%`,
            backgroundColor: barColor,
          }}
        />
        {/* Peak marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-canvas"
          style={{
            left: `calc(${peakPct}% - 5px)`,
            backgroundColor: barColor,
          }}
        />
      </div>
      {/* Scale labels */}
      <div className="flex justify-between mt-1">
        {[1, 3, 6, 8, 11].map((v) => (
          <span
            key={v}
            className="text-2xs font-mono text-cream/30"
            style={{ marginLeft: v === 1 ? 0 : undefined }}
          >
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
      <span className="text-xs text-cream/50">{label}</span>
      <span className="font-mono text-xs text-cream/80">{value.toLocaleString()} L/kg</span>
    </div>
  );
}

// ── Sustainability chip ────────────────────────────────────────────────────

const SUSTAINABILITY_STYLES = {
  low:      'bg-emerald-900/40 border-emerald-500 text-emerald-400',
  moderate: 'bg-yellow-900/40 border-yellow-500 text-yellow-300',
  high:     'bg-red-900/40 border-red-500 text-red-400',
};

// ── Main panel ─────────────────────────────────────────────────────────────

export function EnvironmentalPanel({ env }: { env: FruitEnvironmental }) {
  const t = useTranslations('environmental');

  return (
    <div className="px-4 pb-4">
      <p className="text-2xs text-ink-muted uppercase tracking-wider mb-3">
        {t('title')}
      </p>

      <div className="flex flex-col gap-4">
        {/* Water footprint */}
        <div>
          <p className="text-xs text-cream/40 mb-1.5">{t('waterFootprint')}</p>
          <div className="flex flex-col gap-1 bg-surface/30 rounded-md px-3 py-2">
            <WaterRow label={t('blueWater')} value={env.blueWaterLkg} />
            <WaterRow label={t('greenWater')} value={env.greenWaterLkg} />
            <div className="border-t border-white/8 mt-1 pt-1">
              <WaterRow label={t('totalWater')} value={env.totalWaterLkg} />
            </div>
          </div>
        </div>

        {/* Aquifer stress gauge */}
        <div>
          <p className="text-xs text-cream/40 mb-1.5">{t('aquiferStress')}</p>
          <div className="flex items-center gap-3">
            <AquiferGauge pct={env.aquiferStressPct} />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm text-cream/90">
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
            <p className="text-xs text-cream/40">{t('uvIndex')}</p>
            <span className="font-mono text-xs text-cream/60">
              {t('uvRange', { min: env.uvMin, max: env.uvMax })}
            </span>
          </div>
          <UVBar uvMin={env.uvMin} uvMax={env.uvMax} uvPeak={env.uvPeak} />
          {env.uvNote && (
            <p className="text-2xs text-cream/40 mt-1.5 leading-relaxed">{env.uvNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
