'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Globe, Sprout } from 'lucide-react';
import { getFruitBiodiversity, getFruitProduction } from '@/services/dataService';
import type { BiodiversityData, ProductionData } from '@/types';

function DataRow({ label, value }: { label: string; value: string | number | null }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-2xs text-ink/90">{label}</span>
      <span className="font-mono text-xs text-ink">{value}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' | null }) {
  if (trend === 'up')     return <TrendingUp   size={12} className="text-emerald-600" />;
  if (trend === 'down')   return <TrendingDown size={12} className="text-red-600" />;
  if (trend === 'stable') return <Minus        size={12} className="text-amber-600" />;
  return null;
}

function iucnBadgeClass(cat: string | null): string {
  if (!cat) return 'bg-slate-100 border-slate-300 text-slate-700';
  const c = cat.toUpperCase();
  if (c === 'LC') return 'bg-emerald-100 border-emerald-400 text-emerald-800';
  if (c === 'NT') return 'bg-lime-100 border-lime-400 text-lime-800';
  if (c === 'VU') return 'bg-amber-100 border-amber-400 text-amber-800';
  if (c === 'EN') return 'bg-orange-100 border-orange-400 text-orange-800';
  if (c === 'CR') return 'bg-red-100 border-red-400 text-red-800';
  return 'bg-slate-100 border-slate-300 text-slate-700';
}

interface LiveDataPanelProps {
  fruitId: string;
}

export function LiveDataPanel({ fruitId }: LiveDataPanelProps) {
  const [bio, setBio]         = useState<BiodiversityData | null>(null);
  const [prod, setProd]       = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFruitBiodiversity(fruitId),
      getFruitProduction(fruitId),
    ]).then(([bioData, prodData]) => {
      setBio(bioData);
      setProd(prodData);
      setLoading(false);
    });
  }, [fruitId]);

  if (loading) {
    return (
      <div className="px-4 pb-4">
        <p className="text-2xs text-ink/90 uppercase tracking-wider mb-3 font-medium">Live Data</p>
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-ink/8 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = bio || prod;
  if (!hasData) return null;

  return (
    <div className="px-4 pb-4">
      {/* ── Biodiversity ─────────────────────────────────────────── */}
      {bio && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Globe size={12} className="text-gold" />
            <p className="text-2xs text-ink/90 uppercase tracking-wider font-medium">Biodiversity (GBIF)</p>
          </div>
          <div className="bg-surface-raised rounded-md px-3 py-2 flex flex-col gap-1.5">
            <DataRow
              label="Global occurrences"
              value={bio.globalOccurrences.toLocaleString()}
            />
            <DataRow
              label="Tunisia occurrences"
              value={bio.tunisiaOccurrences.toLocaleString()}
            />
            {bio.earliestRecord && (
              <DataRow
                label="Recorded in Tunisia since"
                value={bio.earliestRecord}
              />
            )}
            {bio.family && (
              <DataRow label="Family" value={bio.family} />
            )}
            {bio.iucnCategory && (
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-2xs text-ink/90">IUCN Status</span>
                <span className={`badge border text-2xs ${iucnBadgeClass(bio.iucnCategory)}`}>
                  {bio.iucnCategory}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Production (FAOSTAT Tunisia) ──────────────────────────── */}
      {prod && prod.productionTonnes != null && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sprout size={12} className="text-gold" />
            <p className="text-2xs text-ink/90 uppercase tracking-wider font-medium">
              Tunisia Production (FAOSTAT{prod.year ? ` ${prod.year}` : ''})
            </p>
          </div>
          <div className="bg-surface-raised rounded-md px-3 py-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xs text-ink/90">Production</span>
              <div className="flex items-center gap-1">
                <TrendIcon trend={prod.trend} />
                <span className="font-mono text-xs text-ink">
                  {prod.productionTonnes?.toLocaleString()} t
                </span>
              </div>
            </div>
            {prod.areaHa != null && (
              <DataRow label="Harvested area" value={`${prod.areaHa.toLocaleString()} ha`} />
            )}
            {prod.yieldKgHa != null && (
              <DataRow label="Yield" value={`${prod.yieldKgHa.toLocaleString()} kg/ha`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
