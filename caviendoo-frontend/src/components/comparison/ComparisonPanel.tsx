'use client';

import { useEffect, useState, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { X, Trash2 } from 'lucide-react';
import { useAtlasStore } from '@/store';
import { getFruitById } from '@/services/dataService';
import { ComparisonSlot } from './ComparisonSlot';
import {
  SectionRow,
  DataRow,
  MiniCalendar,
  rankValues,
  seasonRange,
  RANK_CLS,
} from './ComparisonRow';
import type { Fruit, NutritionalField } from '@/types';

export function ComparisonPanel() {
  const t       = useTranslations('comparison');
  const tEnv    = useTranslations('environmental');
  const tDetail = useTranslations('detail');

  const locale               = useAtlasStore((s) => s.locale);
  const isComparisonOpen     = useAtlasStore((s) => s.isComparisonOpen);
  const setIsComparisonOpen  = useAtlasStore((s) => s.setIsComparisonOpen);
  const comparedFruitIds     = useAtlasStore((s) => s.comparedFruitIds);
  const removeFromComparison = useAtlasStore((s) => s.removeFromComparison);
  const clearComparison      = useAtlasStore((s) => s.clearComparison);

  const [fruits, setFruits] = useState<Fruit[]>([]);

  useEffect(() => {
    Promise.all(comparedFruitIds.map((id) => getFruitById(id))).then(
      (r) => setFruits(r.filter(Boolean) as Fruit[])
    );
  }, [comparedFruitIds]);

  if (!isComparisonOpen || fruits.length < 2) return null;

  const count = fruits.length;

  // ── Pre-compute environmental arrays & ranks ─────────────────────────────
  const blueWaters   = fruits.map((f) => f.environmental.blueWaterLkg);
  const greenWaters  = fruits.map((f) => f.environmental.greenWaterLkg);
  const totalWaters  = fruits.map((f) => f.environmental.totalWaterLkg);
  const aquiferPcts  = fruits.map((f) => f.environmental.aquiferStressPct);
  const uvPeaks      = fruits.map((f) => f.environmental.uvPeak);

  const blueRanks    = rankValues(blueWaters,  true);
  const greenRanks   = rankValues(greenWaters, true);
  const totalRanks   = rankValues(totalWaters, true);
  const aquiferRanks = rankValues(aquiferPcts, true);
  const uvRanks      = rankValues(uvPeaks,     true);

  // Union of all nutritional field keys across compared fruits
  const allNutri = new Map<string, NutritionalField['label']>();
  for (const fruit of fruits)
    for (const field of fruit.nutritional)
      if (!allNutri.has(field.label.en)) allNutri.set(field.label.en, field.label);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-canvas"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
    >
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-surface">
        <div>
          <h2 className="font-serif text-lg text-cream">{t('title')}</h2>
          <p className="text-2xs text-muted mt-0.5">{t('slots', { count })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearComparison}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-cream transition-colors px-2 py-1.5 rounded hover:bg-white/5"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">{t('clear')}</span>
          </button>
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="p-1.5 rounded text-muted hover:text-cream hover:bg-surface-raised transition-colors"
            aria-label={t('close')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable comparison table ──────────────────────────────── */}
      <div className="flex-1 overflow-auto scrollbar-dark">
        <table className="w-full border-collapse" style={{ minWidth: count === 3 ? 560 : 420 }}>
          <thead>
            <tr className="sticky top-0 z-10 bg-surface border-b border-border">
              {/* Empty label column */}
              <th className="w-[110px] min-w-[110px]" />
              {fruits.map((fruit) => (
                <ComparisonSlot
                  key={fruit.id}
                  fruit={fruit}
                  locale={locale}
                  onRemove={removeFromComparison}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {/* ── Seasonality ───────────────────────────────────────── */}
            <SectionRow label={tDetail('seasonCalendar')} colCount={count} />
            <DataRow
              label={tDetail('season')}
              fruits={fruits}
              render={(f) => <MiniCalendar season={f.season} locale={locale} />}
            />
            <DataRow
              label="Range"
              fruits={fruits}
              render={(f) => (
                <span className="font-mono text-xs">{seasonRange(f.season, locale)}</span>
              )}
            />

            {/* ── Environmental ─────────────────────────────────────── */}
            <SectionRow label={tEnv('title')} colCount={count} />
            <DataRow
              label={tEnv('blueWater')}
              fruits={fruits}
              ranks={blueRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[blueRanks[i]]}`}>
                  {blueWaters[i]} L/kg
                </span>
              )}
            />
            <DataRow
              label={tEnv('greenWater')}
              fruits={fruits}
              ranks={greenRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[greenRanks[i]]}`}>
                  {greenWaters[i]} L/kg
                </span>
              )}
            />
            <DataRow
              label={tEnv('totalWater')}
              fruits={fruits}
              ranks={totalRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[totalRanks[i]]}`}>
                  {totalWaters[i]} L/kg
                </span>
              )}
            />
            <DataRow
              label={tEnv('aquiferStress')}
              fruits={fruits}
              ranks={aquiferRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[aquiferRanks[i]]}`}>
                  {aquiferPcts[i]}%
                </span>
              )}
            />
            <DataRow
              label={tEnv('uvPeak')}
              fruits={fruits}
              ranks={uvRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[uvRanks[i]]}`}>
                  UV {uvPeaks[i]}
                </span>
              )}
            />
            <DataRow
              label={tEnv('sustainability')}
              fruits={fruits}
              render={(f) => (
                <span
                  className={[
                    'badge border text-2xs',
                    f.environmental.sustainabilityClass === 'low'
                      ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400'
                      : f.environmental.sustainabilityClass === 'moderate'
                      ? 'bg-yellow-900/40 border-yellow-500 text-yellow-300'
                      : 'bg-red-900/40 border-red-500 text-red-400',
                  ].join(' ')}
                >
                  {tEnv(`sustainability_${f.environmental.sustainabilityClass}`)}
                </span>
              )}
            />

            {/* ── Nutritional ───────────────────────────────────────── */}
            <SectionRow label={tDetail('nutritional')} colCount={count} />
            {Array.from(allNutri.entries()).map(([key, label]) => (
              <Fragment key={key}>
                <DataRow
                  label={label[locale]}
                  fruits={fruits}
                  render={(f) => {
                    const field = f.nutritional.find((n) => n.label.en === key);
                    return (
                      <span className="font-mono text-xs text-cream/80">
                        {field?.value ?? '—'}
                      </span>
                    );
                  }}
                />
              </Fragment>
            ))}

            {/* Bottom padding */}
            <tr><td colSpan={count + 1} className="py-6" /></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
