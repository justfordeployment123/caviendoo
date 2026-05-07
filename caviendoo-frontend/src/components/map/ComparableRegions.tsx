'use client';

import { useState } from 'react';
import { GitCompare, Loader2, ChevronRight } from 'lucide-react';
import { getComparableRegions } from '@/services/dataService';
import { useAtlasStore } from '@/store';
import type { ComparableRegionsResult, ComparableRegion } from '@/types';

interface ComparableRegionsProps {
  regionId: number;
  fruitId: string;
  fruitName: string;
  onRegionClick: (shapeName: string) => void;
}

const FACTOR_LABELS: Record<string, string> = {
  similar_uv:           'UV match',
  similar_water_stress: 'Water match',
  same_climate_zone:    'Same climate',
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-amber-400' :
                'bg-red-400';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-2xs font-mono font-semibold shrink-0 ${
        pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'
      }`}>{pct}%</span>
    </div>
  );
}

function RegionRow({ region, onClick }: { region: ComparableRegion; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-surface-raised transition-colors group"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-medium text-ink group-hover:text-gold transition-colors truncate">
          {region.shapeName}
        </span>
        <ChevronRight size={11} className="text-muted shrink-0 group-hover:text-gold transition-colors" />
      </div>
      <ScoreBar score={region.similarityScore} />
      {region.matchFactors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {region.matchFactors.map((f) => (
            <span key={f} className="text-2xs px-1.5 py-0 rounded-full bg-surface border border-border text-muted">
              {FACTOR_LABELS[f] ?? f}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export function ComparableRegions({ regionId, fruitId, fruitName, onRegionClick }: ComparableRegionsProps) {
  const [result, setResult] = useState<ComparableRegionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = async () => {
    if (loaded || loading) return;
    setLoading(true);
    setError(false);
    const data = await getComparableRegions(fruitId, regionId);
    setLoading(false);
    setLoaded(true);
    if (data) setResult(data);
    else setError(true);
  };

  return (
    <div className="border-t border-border">
      {!loaded ? (
        <button
          onClick={handleLoad}
          disabled={loading}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-muted hover:text-gold hover:bg-surface-raised transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin shrink-0" />
          ) : (
            <GitCompare size={12} className="shrink-0" />
          )}
          <span className="text-left">
            {loading ? 'Finding comparable regions…' : `Comparable regions for ${fruitName}`}
          </span>
        </button>
      ) : error ? (
        <p className="px-3 py-2 text-2xs text-red-500">Failed to load — try again.</p>
      ) : result ? (
        <div>
          <p className="px-3 pt-2.5 pb-1 text-2xs text-muted uppercase tracking-widest font-medium">
            Where else can {result.fruit.name} grow?
          </p>
          <div className="divide-y divide-border/50">
            {result.comparableRegions.map((r) => (
              <RegionRow
                key={r.shapeName}
                region={r}
                onClick={() => onRegionClick(r.shapeName)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
