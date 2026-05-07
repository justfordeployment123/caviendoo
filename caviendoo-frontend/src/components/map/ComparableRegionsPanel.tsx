'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, MapPin } from 'lucide-react';
import { getComparableRegions } from '@/services/dataService';
import { useAtlasStore } from '@/store';
import type { ComparableRegionsResult, ComparableRegion } from '@/types';

interface Props {
  fruitId:    string;
  regionId:   number;
  regionName: string;
  onClose:    () => void;
}

const FACTOR_LABELS: Record<string, string> = {
  similar_uv:           'UV match',
  similar_water_stress: 'Water match',
  same_climate_zone:    'Same climate',
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-2xs font-mono font-semibold ${textColor}`}>{pct}%</span>
    </div>
  );
}

function RegionRow({ region, onSelect }: { region: ComparableRegion; onSelect: () => void }) {
  const verdict =
    region.similarityScore >= 0.8 ? 'High match' :
    region.similarityScore >= 0.6 ? 'Moderate' : 'Low match';

  return (
    <button
      onClick={onSelect}
      className="flex items-start gap-3 px-4 py-3 hover:bg-surface-raised transition-colors text-left w-full border-b border-border/50 last:border-0 group"
    >
      <MapPin size={13} className="text-muted shrink-0 mt-0.5 group-hover:text-gold transition-colors" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span className="text-sm font-medium text-ink group-hover:text-gold transition-colors truncate">
            {region.shapeName}
          </span>
          <span className="text-2xs text-muted shrink-0">{verdict}</span>
        </div>
        <ScoreBar score={region.similarityScore} />
        {region.matchFactors.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {region.matchFactors.map((f) => (
              <span
                key={f}
                className="text-2xs px-1.5 py-px rounded-full bg-surface border border-border text-muted"
              >
                {FACTOR_LABELS[f] ?? f}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export function ComparableRegionsPanel({ fruitId, regionId, regionName, onClose }: Props) {
  const [result, setResult] = useState<ComparableRegionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const setSelectedGovernorate = useAtlasStore((s) => s.setSelectedGovernorate);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getComparableRegions(fruitId, regionId).then((data) => {
      setLoading(false);
      if (data) setResult(data);
      else setError(true);
    });
  }, [fruitId, regionId]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
      <div className="bg-surface border-t border-border shadow-panel-dark" style={{ maxHeight: 280 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink truncate">
              {result ? `Where else can ${result.fruit.name} grow?` : 'Comparable regions'}
            </p>
            <p className="text-2xs text-muted mt-0.5">
              Similar climate to <span className="font-medium text-ink">{regionName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="ms-3 p-1.5 rounded text-muted hover:text-ink hover:bg-surface-raised transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Finding comparable regions…</span>
            </div>
          )}
          {error && (
            <p className="text-center text-sm text-red-500 py-8">
              Failed to load — check API connection.
            </p>
          )}
          {result && (
            <div>
              {result.comparableRegions.map((r) => (
                <RegionRow
                  key={r.shapeName}
                  region={r}
                  onSelect={() => {
                    setSelectedGovernorate(r.shapeName);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
