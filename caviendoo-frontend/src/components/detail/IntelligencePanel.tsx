'use client';

import { useTranslations } from 'next-intl';
import { useAtlasStore } from '@/store';
import { MONTH_LABELS } from '@/types';
import type {
  Locale,
  FruitSoil, FruitClimate, FruitEconomics,
  FruitConservation, FruitPhenology, FruitSustainability,
} from '@/types';

type TFn = (key: string, values?: Record<string, string | number>) => string;

// ── Shared helpers ────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-2xs text-ink/80">{label}</span>
      <span className="font-mono text-xs text-ink font-medium shrink-0">{value}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-2">
      <p className="text-2xs text-ink/90 uppercase tracking-wider font-semibold">{title}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-raised rounded-md px-3 py-2 flex flex-col gap-0.5">
      {children}
    </div>
  );
}

function ToleranceBadge({ level, t }: { level: 'low' | 'medium' | 'high' | null; t: TFn }) {
  if (!level) return null;
  const styles = {
    low:    'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-amber-100 border-amber-300 text-amber-800',
    high:   'bg-emerald-100 border-emerald-300 text-emerald-800',
  };
  return (
    <span className={`badge border text-2xs ${styles[level]}`}>{t(`tolerance_${level}`)}</span>
  );
}

// ── Conservation status badge ──────────────────────────────────────────────────

const CONSERVATION_STYLES: Record<string, string> = {
  common:     'bg-emerald-100 border-emerald-400 text-emerald-800',
  watch:      'bg-sky-100 border-sky-400 text-sky-800',
  vulnerable: 'bg-amber-100 border-amber-400 text-amber-800',
  endangered: 'bg-orange-100 border-orange-400 text-orange-800',
  critical:   'bg-red-100 border-red-500 text-red-900',
};

function ConservationBadge({ status, t }: { status: string | null; t: TFn }) {
  if (!status) return null;
  return (
    <span className={`badge border text-2xs ${CONSERVATION_STYLES[status] ?? 'bg-slate-100 border-slate-300 text-slate-700'}`}>
      {t(`conservation_${status}`)}
    </span>
  );
}

// ── Export status badge ────────────────────────────────────────────────────────

const EXPORT_STYLES: Record<string, string> = {
  exported:       'bg-blue-100 border-blue-300 text-blue-800',
  local_only:     'bg-slate-100 border-slate-300 text-slate-600',
  artisanal_only: 'bg-amber-100 border-amber-300 text-amber-800',
};

// ── Section components ────────────────────────────────────────────────────────

function SoilSection({ soil, t }: { soil: FruitSoil; t: TFn }) {
  const hasData = soil.phMin != null || soil.salinityTolerance || soil.types.length > 0;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader title={t('soil')} />
      <Card>
        {soil.phMin != null && soil.phMax != null && (
          <Row label={t('phRange')} value={`${soil.phMin} – ${soil.phMax}`} />
        )}
        {soil.salinityTolerance && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">{t('salinityTolerance')}</span>
            <ToleranceBadge level={soil.salinityTolerance} t={t} />
          </div>
        )}
        {soil.types.length > 0 && (
          <div className="flex items-start justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80 shrink-0">{t('suitableSoils')}</span>
            <span className="text-xs text-ink text-right capitalize">
              {soil.types.join(', ')}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

function ClimateSection({ climate, t, locale }: { climate: FruitClimate; t: TFn; locale: Locale }) {
  const hasData = climate.chillHoursMin != null || climate.rainfallMmMin != null
    || climate.droughtTolerance || climate.frostRiskMonths.length > 0;
  if (!hasData) return null;
  const monthLabels = MONTH_LABELS[locale];
  const frostMonths = climate.frostRiskMonths.map((m) => monthLabels[m]).join(', ');
  return (
    <div className="mb-3">
      <SectionHeader title={t('climate')} />
      <Card>
        {climate.chillHoursMin != null && (
          <Row label={t('chillHours')} value={`${climate.chillHoursMin} h`} />
        )}
        {climate.rainfallMmMin != null && climate.rainfallMmMax != null && (
          <Row label={t('annualRainfall')} value={`${climate.rainfallMmMin}–${climate.rainfallMmMax} mm`} />
        )}
        {climate.droughtTolerance && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">{t('droughtTolerance')}</span>
            <ToleranceBadge level={climate.droughtTolerance} t={t} />
          </div>
        )}
        {frostMonths && (
          <Row label={t('frostRiskMonths')} value={frostMonths} />
        )}
      </Card>
    </div>
  );
}

function EconomicsSection({ economics, t }: { economics: FruitEconomics; t: TFn }) {
  const hasData = economics.productionTonnesYear != null || economics.exportStatus
    || economics.pricePremiumIndex != null;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader title={t('economics')} />
      <Card>
        {economics.productionTonnesYear != null && (
          <Row
            label={t('tunisiaProduction')}
            value={`${economics.productionTonnesYear.toLocaleString()} t/yr`}
          />
        )}
        {economics.exportStatus && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">{t('marketStatus')}</span>
            <span className={`badge border text-2xs ${EXPORT_STYLES[economics.exportStatus]}`}>
              {t(`export_${economics.exportStatus}`)}
            </span>
          </div>
        )}
        {economics.pricePremiumIndex != null && (
          <Row
            label={t('pricePremium')}
            value={economics.pricePremiumIndex === 1.0
              ? t('priceBaseline')
              : t('priceMarket', { value: economics.pricePremiumIndex.toFixed(1) })}
          />
        )}
      </Card>
    </div>
  );
}

function ConservationSection({ conservation, t }: { conservation: FruitConservation; t: TFn }) {
  const hasData = conservation.status || conservation.knownFarmsCount != null
    || conservation.seedBankStatus != null;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader title={t('conservation')} />
      <Card>
        {conservation.status && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">{t('status')}</span>
            <ConservationBadge status={conservation.status} t={t} />
          </div>
        )}
        {conservation.knownFarmsCount != null && (
          <Row label={t('knownFarms')} value={conservation.knownFarmsCount.toLocaleString()} />
        )}
        {conservation.seedBankStatus != null && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">{t('seedBank')}</span>
            <span className={`badge border text-2xs ${conservation.seedBankStatus
              ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
              : 'bg-slate-100 border-slate-300 text-slate-600'}`}>
              {conservation.seedBankStatus ? t('seedBankPreserved') : t('seedBankNot')}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

function PhenologySection({ phenology, t }: { phenology: FruitPhenology; t: TFn }) {
  const hasData = phenology.daysFlowerToHarvest != null || phenology.harvestWindowDays != null
    || phenology.pollinatorDependency;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader title={t('phenology')} />
      <Card>
        {phenology.daysFlowerToHarvest != null && (
          <Row
            label={t('flowerToHarvest')}
            value={t('daysValue', { count: phenology.daysFlowerToHarvest })}
          />
        )}
        {phenology.harvestWindowDays != null && (
          <Row
            label={t('harvestWindow')}
            value={t('daysValue', { count: phenology.harvestWindowDays })}
          />
        )}
        {phenology.pollinatorDependency && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">{t('pollination')}</span>
            <span className="text-xs text-ink">
              {t(`pollinator_${phenology.pollinatorDependency}`)}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

function SustainabilitySection({ sustainability, t }: { sustainability: FruitSustainability; t: TFn }) {
  const hasData = sustainability.carbonFootprintKgCo2 != null
    || sustainability.postHarvestLossPct != null;
  if (!hasData) return null;

  const co2 = sustainability.carbonFootprintKgCo2;
  const co2Color = co2 == null ? '' : co2 < 1 ? 'text-emerald-700' : co2 < 3 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="mb-3">
      <SectionHeader title={t('sustainability')} />
      <Card>
        {co2 != null && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">{t('carbonFootprint')}</span>
            <span className={`font-mono text-xs font-medium ${co2Color}`}>
              {co2.toFixed(1)} kg CO₂e/kg
            </span>
          </div>
        )}
        {sustainability.postHarvestLossPct != null && (
          <Row
            label={t('postHarvestLoss')}
            value={`${sustainability.postHarvestLossPct}%`}
          />
        )}
      </Card>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface IntelligencePanelProps {
  soil?:           FruitSoil | null;
  climate?:        FruitClimate | null;
  economics?:      FruitEconomics | null;
  conservation?:   FruitConservation | null;
  phenology?:      FruitPhenology | null;
  sustainability?: FruitSustainability | null;
}

export function IntelligencePanel({
  soil, climate, economics, conservation, phenology, sustainability,
}: IntelligencePanelProps) {
  const t = useTranslations('intelligence') as unknown as TFn;
  const locale = useAtlasStore((s) => s.locale);

  const hasAny = soil || climate || economics || conservation || phenology || sustainability;
  if (!hasAny) return null;

  return (
    <div className="px-4 pb-2">
      <p className="text-2xs text-ink/90 uppercase tracking-wider mb-3 font-semibold">
        {t('title')}
      </p>
      {soil         && <SoilSection         soil={soil}         t={t} />}
      {climate      && <ClimateSection      climate={climate}   t={t} locale={locale} />}
      {economics    && <EconomicsSection    economics={economics} t={t} />}
      {conservation && <ConservationSection conservation={conservation} t={t} />}
      {phenology    && <PhenologySection    phenology={phenology} t={t} />}
      {sustainability && <SustainabilitySection sustainability={sustainability} t={t} />}
    </div>
  );
}
