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
import { MONTH_LABELS } from '@/types';
import type { Fruit, NutritionalField } from '@/types';

// ── Badge helpers ─────────────────────────────────────────────────────────────

type TFn = (key: string, values?: Record<string, string | number>) => string;

const TOLERANCE_STYLES: Record<string, string> = {
  low:    'bg-red-100 border-red-300 text-red-800',
  medium: 'bg-amber-100 border-amber-300 text-amber-800',
  high:   'bg-emerald-100 border-emerald-300 text-emerald-800',
};

const CONSERVATION_STYLES: Record<string, string> = {
  common:     'bg-emerald-100 border-emerald-400 text-emerald-800',
  watch:      'bg-sky-100 border-sky-400 text-sky-800',
  vulnerable: 'bg-amber-100 border-amber-400 text-amber-800',
  endangered: 'bg-orange-100 border-orange-400 text-orange-800',
  critical:   'bg-red-100 border-red-500 text-red-900',
};

const EXPORT_STYLES: Record<string, string> = {
  exported:       'bg-blue-100 border-blue-300 text-blue-800',
  local_only:     'bg-slate-100 border-slate-300 text-slate-600',
  artisanal_only: 'bg-amber-100 border-amber-300 text-amber-800',
};

function Badge({ cls, label }: { cls: string; label: string }) {
  return <span className={`badge border text-2xs ${cls}`}>{label}</span>;
}

function Dash() {
  return <span className="text-xs text-muted">—</span>;
}

export function ComparisonPanel() {
  const t       = useTranslations('comparison');
  const tEnv    = useTranslations('environmental');
  const tDetail = useTranslations('detail');
  const tI      = useTranslations('intelligence') as unknown as TFn;

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
  const monthLabels = MONTH_LABELS[locale];

  // ── Environmental ranks ──────────────────────────────────────────────────
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

  // ── Nutritional map ──────────────────────────────────────────────────────
  const allNutri = new Map<string, NutritionalField['label']>();
  for (const fruit of fruits)
    for (const field of fruit.nutritional)
      if (!allNutri.has(field.label.en)) allNutri.set(field.label.en, field.label);

  // ── Agronomy presence guards ─────────────────────────────────────────────
  const hasSoil         = fruits.some((f) => f.soil);
  const hasClimate      = fruits.some((f) => f.climate);
  const hasEconomics    = fruits.some((f) => f.economics);
  const hasConservation = fruits.some((f) => f.conservation);
  const hasPhenology    = fruits.some((f) => f.phenology);
  const hasSustain      = fruits.some((f) => f.sustainability);

  // ── Agronomy ranks (only when all fruits have the value) ─────────────────
  const allPresent = (vals: (number | null)[]) => vals.every((v) => v != null);

  const productionVals     = fruits.map((f) => f.economics?.productionTonnesYear    ?? null);
  const premiumVals        = fruits.map((f) => f.economics?.pricePremiumIndex        ?? null);
  const daysToHarvestVals  = fruits.map((f) => f.phenology?.daysFlowerToHarvest      ?? null);
  const harvestWindowVals  = fruits.map((f) => f.phenology?.harvestWindowDays         ?? null);
  const co2Vals            = fruits.map((f) => f.sustainability?.carbonFootprintKgCo2 ?? null);
  const lossVals           = fruits.map((f) => f.sustainability?.postHarvestLossPct   ?? null);

  const productionRanks    = allPresent(productionVals)    ? rankValues(productionVals    as number[], false) : null;
  const premiumRanks       = allPresent(premiumVals)       ? rankValues(premiumVals       as number[], false) : null;
  const daysToHarvestRanks = allPresent(daysToHarvestVals) ? rankValues(daysToHarvestVals as number[], true)  : null;
  const harvestWindowRanks = allPresent(harvestWindowVals) ? rankValues(harvestWindowVals as number[], false) : null;
  const co2Ranks           = allPresent(co2Vals)           ? rankValues(co2Vals           as number[], true)  : null;
  const lossRanks          = allPresent(lossVals)          ? rankValues(lossVals          as number[], true)  : null;

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
          <h2 className="font-serif text-lg text-ink">{t('title')}</h2>
          <p className="text-2xs text-muted mt-0.5">{t('slots', { count })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearComparison}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors px-2 py-1.5 rounded hover:bg-ink/5"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">{t('clear')}</span>
          </button>
          <button
            onClick={() => setIsComparisonOpen(false)}
            className="p-1.5 rounded text-muted hover:text-ink hover:bg-ink/5 transition-colors"
            aria-label={t('close')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable comparison table ──────────────────────────────── */}
      <div className="flex-1 overflow-auto scrollbar-dark">
        <table className="w-full border-collapse" style={{ minWidth: count === 3 ? 640 : 480 }}>
          <thead>
            <tr className="sticky top-0 z-10 bg-surface border-b border-border">
              <th className="w-[140px] min-w-[140px]" />
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
            {/* ── Overview ─────────────────────────────────────────────── */}
            <SectionRow label="Overview" colCount={count} />
            <DataRow
              label={tDetail('zone')}
              fruits={fruits}
              render={(f) => <span className="text-xs text-ink">{f.zone[locale] || '—'}</span>}
            />
            <DataRow
              label={tDetail('growingRegions')}
              fruits={fruits}
              render={(f) => (
                <span className="text-xs text-ink">
                  {f.governorates.length > 0
                    ? f.governorates.slice(0, 3).join(', ') + (f.governorates.length > 3 ? ` +${f.governorates.length - 3}` : '')
                    : '—'}
                </span>
              )}
            />
            <DataRow
              label="Status"
              fruits={fruits}
              render={(f) => (
                <div className="flex gap-1 justify-center flex-wrap">
                  {f.isAOC && <Badge cls="bg-gold/20 border-gold/40 text-gold" label="AOC" />}
                  {f.isHeritage && <Badge cls="bg-purple-100 border-purple-400 text-purple-800" label="Heritage" />}
                  {!f.isAOC && !f.isHeritage && <Dash />}
                </div>
              )}
            />

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
                <span className="font-mono text-xs text-ink">{seasonRange(f.season, locale)}</span>
              )}
            />

            {/* ── Environmental ─────────────────────────────────────── */}
            <SectionRow label={tEnv('title')} colCount={count} />
            <DataRow
              label={tEnv('blueWater')}
              fruits={fruits}
              ranks={blueRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[blueRanks[i]]}`}>{blueWaters[i]} L/kg</span>
              )}
            />
            <DataRow
              label={tEnv('greenWater')}
              fruits={fruits}
              ranks={greenRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[greenRanks[i]]}`}>{greenWaters[i]} L/kg</span>
              )}
            />
            <DataRow
              label={tEnv('totalWater')}
              fruits={fruits}
              ranks={totalRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[totalRanks[i]]}`}>{totalWaters[i]} L/kg</span>
              )}
            />
            <DataRow
              label={tEnv('aquiferStress')}
              fruits={fruits}
              ranks={aquiferRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[aquiferRanks[i]]}`}>{aquiferPcts[i]}%</span>
              )}
            />
            <DataRow
              label={tEnv('uvPeak')}
              fruits={fruits}
              ranks={uvRanks}
              render={(_, i) => (
                <span className={`font-mono text-xs ${RANK_CLS[uvRanks[i]]}`}>UV {uvPeaks[i]}</span>
              )}
            />
            <DataRow
              label={tEnv('sustainability')}
              fruits={fruits}
              render={(f) => (
                <span className={[
                  'badge border text-2xs',
                  f.environmental.sustainabilityClass === 'low'   ? 'bg-emerald-100 border-emerald-400 text-emerald-800' :
                  f.environmental.sustainabilityClass === 'moderate' ? 'bg-amber-100 border-amber-400 text-amber-800' :
                  'bg-red-100 border-red-400 text-red-800',
                ].join(' ')}>
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
                    return <span className="font-mono text-xs text-ink">{field?.value ?? '—'}</span>;
                  }}
                />
              </Fragment>
            ))}

            {/* ── Soil ──────────────────────────────────────────────── */}
            {hasSoil && <>
              <SectionRow label={tI('soil')} colCount={count} />
              {fruits.some((f) => f.soil?.phMin != null) && (
                <DataRow
                  label={tI('phRange')}
                  fruits={fruits}
                  render={(f) => (
                    <span className="font-mono text-xs text-ink">
                      {f.soil?.phMin != null && f.soil?.phMax != null ? `${f.soil.phMin}–${f.soil.phMax}` : <Dash />}
                    </span>
                  )}
                />
              )}
              {fruits.some((f) => f.soil?.salinityTolerance) && (
                <DataRow
                  label={tI('salinityTolerance')}
                  fruits={fruits}
                  render={(f) => f.soil?.salinityTolerance
                    ? <Badge cls={TOLERANCE_STYLES[f.soil.salinityTolerance]} label={tI(`tolerance_${f.soil.salinityTolerance}`)} />
                    : <Dash />}
                />
              )}
              {fruits.some((f) => f.soil?.types && f.soil.types.length > 0) && (
                <DataRow
                  label={tI('suitableSoils')}
                  fruits={fruits}
                  render={(f) => (
                    <span className="text-xs text-ink capitalize">{f.soil?.types?.join(', ') || '—'}</span>
                  )}
                />
              )}
            </>}

            {/* ── Climate ───────────────────────────────────────────── */}
            {hasClimate && <>
              <SectionRow label={tI('climate')} colCount={count} />
              {fruits.some((f) => f.climate?.chillHoursMin != null) && (
                <DataRow
                  label={tI('chillHours')}
                  fruits={fruits}
                  render={(f) => (
                    <span className="font-mono text-xs text-ink">
                      {f.climate?.chillHoursMin != null ? `${f.climate.chillHoursMin} h` : '—'}
                    </span>
                  )}
                />
              )}
              {fruits.some((f) => f.climate?.rainfallMmMin != null) && (
                <DataRow
                  label={tI('annualRainfall')}
                  fruits={fruits}
                  render={(f) => (
                    <span className="font-mono text-xs text-ink">
                      {f.climate?.rainfallMmMin != null
                        ? f.climate.rainfallMmMax != null
                          ? `${f.climate.rainfallMmMin}–${f.climate.rainfallMmMax} mm`
                          : `${f.climate.rainfallMmMin}+ mm`
                        : '—'}
                    </span>
                  )}
                />
              )}
              {fruits.some((f) => f.climate?.droughtTolerance) && (
                <DataRow
                  label={tI('droughtTolerance')}
                  fruits={fruits}
                  render={(f) => f.climate?.droughtTolerance
                    ? <Badge cls={TOLERANCE_STYLES[f.climate.droughtTolerance]} label={tI(`tolerance_${f.climate.droughtTolerance}`)} />
                    : <Dash />}
                />
              )}
              {fruits.some((f) => f.climate?.frostRiskMonths && f.climate.frostRiskMonths.length > 0) && (
                <DataRow
                  label={tI('frostRiskMonths')}
                  fruits={fruits}
                  render={(f) => (
                    <span className="text-xs text-ink">
                      {f.climate?.frostRiskMonths?.length
                        ? f.climate.frostRiskMonths.map((m) => monthLabels[m]).join(', ')
                        : '—'}
                    </span>
                  )}
                />
              )}
            </>}

            {/* ── Economics ─────────────────────────────────────────── */}
            {hasEconomics && <>
              <SectionRow label={tI('economics')} colCount={count} />
              {fruits.some((f) => f.economics?.productionTonnesYear != null) && (
                <DataRow
                  label={tI('tunisiaProduction')}
                  fruits={fruits}
                  ranks={productionRanks ?? undefined}
                  render={(f, i) => {
                    const v = f.economics?.productionTonnesYear;
                    const cls = productionRanks ? RANK_CLS[productionRanks[i]] : 'text-ink';
                    return <span className={`font-mono text-xs ${cls}`}>{v != null ? `${v.toLocaleString()} t/yr` : '—'}</span>;
                  }}
                />
              )}
              {fruits.some((f) => f.economics?.exportStatus) && (
                <DataRow
                  label={tI('marketStatus')}
                  fruits={fruits}
                  render={(f) => f.economics?.exportStatus
                    ? <Badge cls={EXPORT_STYLES[f.economics.exportStatus] ?? ''} label={tI(`export_${f.economics.exportStatus}`)} />
                    : <Dash />}
                />
              )}
              {fruits.some((f) => f.economics?.pricePremiumIndex != null) && (
                <DataRow
                  label={tI('pricePremium')}
                  fruits={fruits}
                  ranks={premiumRanks ?? undefined}
                  render={(f, i) => {
                    const v = f.economics?.pricePremiumIndex;
                    const cls = premiumRanks ? RANK_CLS[premiumRanks[i]] : 'text-ink';
                    return (
                      <span className={`font-mono text-xs ${cls}`}>
                        {v != null ? (v === 1.0 ? tI('priceBaseline') : tI('priceMarket', { value: v.toFixed(1) })) : '—'}
                      </span>
                    );
                  }}
                />
              )}
            </>}

            {/* ── Conservation ──────────────────────────────────────── */}
            {hasConservation && <>
              <SectionRow label={tI('conservation')} colCount={count} />
              {fruits.some((f) => f.conservation?.status) && (
                <DataRow
                  label={tI('status')}
                  fruits={fruits}
                  render={(f) => f.conservation?.status
                    ? <Badge cls={CONSERVATION_STYLES[f.conservation.status] ?? 'bg-slate-100 border-slate-300 text-slate-700'} label={tI(`conservation_${f.conservation.status}`)} />
                    : <Dash />}
                />
              )}
              {fruits.some((f) => f.conservation?.knownFarmsCount != null) && (
                <DataRow
                  label={tI('knownFarms')}
                  fruits={fruits}
                  render={(f) => (
                    <span className="font-mono text-xs text-ink">
                      {f.conservation?.knownFarmsCount != null ? f.conservation.knownFarmsCount.toLocaleString() : '—'}
                    </span>
                  )}
                />
              )}
              {fruits.some((f) => f.conservation?.seedBankStatus != null) && (
                <DataRow
                  label={tI('seedBank')}
                  fruits={fruits}
                  render={(f) => {
                    if (f.conservation?.seedBankStatus == null) return <Dash />;
                    return (
                      <Badge
                        cls={f.conservation.seedBankStatus
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                          : 'bg-slate-100 border-slate-300 text-slate-600'}
                        label={f.conservation.seedBankStatus ? tI('seedBankPreserved') : tI('seedBankNot')}
                      />
                    );
                  }}
                />
              )}
            </>}

            {/* ── Phenology ─────────────────────────────────────────── */}
            {hasPhenology && <>
              <SectionRow label={tI('phenology')} colCount={count} />
              {fruits.some((f) => f.phenology?.daysFlowerToHarvest != null) && (
                <DataRow
                  label={tI('flowerToHarvest')}
                  fruits={fruits}
                  ranks={daysToHarvestRanks ?? undefined}
                  render={(f, i) => {
                    const v = f.phenology?.daysFlowerToHarvest;
                    const cls = daysToHarvestRanks ? RANK_CLS[daysToHarvestRanks[i]] : 'text-ink';
                    return <span className={`font-mono text-xs ${cls}`}>{v != null ? tI('daysValue', { count: v }) : '—'}</span>;
                  }}
                />
              )}
              {fruits.some((f) => f.phenology?.harvestWindowDays != null) && (
                <DataRow
                  label={tI('harvestWindow')}
                  fruits={fruits}
                  ranks={harvestWindowRanks ?? undefined}
                  render={(f, i) => {
                    const v = f.phenology?.harvestWindowDays;
                    const cls = harvestWindowRanks ? RANK_CLS[harvestWindowRanks[i]] : 'text-ink';
                    return <span className={`font-mono text-xs ${cls}`}>{v != null ? tI('daysValue', { count: v }) : '—'}</span>;
                  }}
                />
              )}
              {fruits.some((f) => f.phenology?.pollinatorDependency) && (
                <DataRow
                  label={tI('pollination')}
                  fruits={fruits}
                  render={(f) => (
                    <span className="text-xs text-ink">
                      {f.phenology?.pollinatorDependency ? tI(`pollinator_${f.phenology.pollinatorDependency}`) : '—'}
                    </span>
                  )}
                />
              )}
            </>}

            {/* ── Carbon & Sustainability ───────────────────────────── */}
            {hasSustain && <>
              <SectionRow label={tI('sustainability')} colCount={count} />
              {fruits.some((f) => f.sustainability?.carbonFootprintKgCo2 != null) && (
                <DataRow
                  label={tI('carbonFootprint')}
                  fruits={fruits}
                  ranks={co2Ranks ?? undefined}
                  render={(f, i) => {
                    const v = f.sustainability?.carbonFootprintKgCo2;
                    const cls = co2Ranks
                      ? RANK_CLS[co2Ranks[i]]
                      : v == null ? 'text-ink' : v < 1 ? 'text-emerald-700' : v < 3 ? 'text-amber-700' : 'text-red-700';
                    return <span className={`font-mono text-xs font-medium ${cls}`}>{v != null ? `${v.toFixed(1)} kg CO₂e` : '—'}</span>;
                  }}
                />
              )}
              {fruits.some((f) => f.sustainability?.postHarvestLossPct != null) && (
                <DataRow
                  label={tI('postHarvestLoss')}
                  fruits={fruits}
                  ranks={lossRanks ?? undefined}
                  render={(f, i) => {
                    const v = f.sustainability?.postHarvestLossPct;
                    const cls = lossRanks ? RANK_CLS[lossRanks[i]] : 'text-ink';
                    return <span className={`font-mono text-xs ${cls}`}>{v != null ? `${v}%` : '—'}</span>;
                  }}
                />
              )}
            </>}

            <tr><td colSpan={count + 1} className="py-6" /></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
