'use client';

import type {
  FruitSoil, FruitClimate, FruitEconomics,
  FruitConservation, FruitPhenology, FruitSustainability,
} from '@/types';

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

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-sm">{icon}</span>
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

function ToleranceBadge({ level }: { level: 'low' | 'medium' | 'high' | null }) {
  if (!level) return null;
  const styles = {
    low:    'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-amber-100 border-amber-300 text-amber-800',
    high:   'bg-emerald-100 border-emerald-300 text-emerald-800',
  };
  return (
    <span className={`badge border text-2xs capitalize ${styles[level]}`}>{level}</span>
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

function ConservationBadge({ status }: { status: string | null }) {
  if (!status) return null;
  return (
    <span className={`badge border text-2xs capitalize ${CONSERVATION_STYLES[status] ?? 'bg-slate-100 border-slate-300 text-slate-700'}`}>
      {status}
    </span>
  );
}

// ── Export status badge ────────────────────────────────────────────────────────

const EXPORT_LABELS: Record<string, string> = {
  exported:       'Exported',
  local_only:     'Local only',
  artisanal_only: 'Artisanal',
};

const EXPORT_STYLES: Record<string, string> = {
  exported:       'bg-blue-100 border-blue-300 text-blue-800',
  local_only:     'bg-slate-100 border-slate-300 text-slate-600',
  artisanal_only: 'bg-amber-100 border-amber-300 text-amber-800',
};

// ── Pollinator badge ───────────────────────────────────────────────────────────

const POLLINATOR_LABELS: Record<string, string> = {
  self_fertile:       'Self-fertile',
  bee_dependent:      'Bee-dependent',
  cross_pollination:  'Cross-pollination',
};

const POLLINATOR_ICONS: Record<string, string> = {
  self_fertile:       '🌿',
  bee_dependent:      '🐝',
  cross_pollination:  '🌸',
};

// ── Month names ────────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Section components ────────────────────────────────────────────────────────

function SoilSection({ soil }: { soil: FruitSoil }) {
  const hasData = soil.phMin != null || soil.salinityTolerance || soil.types.length > 0;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader icon="🪨" title="Soil & Land Quality" />
      <Card>
        {soil.phMin != null && soil.phMax != null && (
          <Row label="Soil pH range" value={`${soil.phMin} – ${soil.phMax}`} />
        )}
        {soil.salinityTolerance && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">Salinity tolerance</span>
            <ToleranceBadge level={soil.salinityTolerance} />
          </div>
        )}
        {soil.types.length > 0 && (
          <div className="flex items-start justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80 shrink-0">Suitable soils</span>
            <span className="text-xs text-ink text-right capitalize">
              {soil.types.join(', ')}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

function ClimateSection({ climate }: { climate: FruitClimate }) {
  const hasData = climate.chillHoursMin != null || climate.rainfallMmMin != null
    || climate.droughtTolerance || climate.frostRiskMonths.length > 0;
  if (!hasData) return null;
  const frostMonths = climate.frostRiskMonths.map((m) => MONTH_SHORT[m]).join(', ');
  return (
    <div className="mb-3">
      <SectionHeader icon="🌡️" title="Climate & Temperature" />
      <Card>
        {climate.chillHoursMin != null && (
          <Row label="Chill hours required" value={`${climate.chillHoursMin} h`} />
        )}
        {climate.rainfallMmMin != null && climate.rainfallMmMax != null && (
          <Row label="Annual rainfall" value={`${climate.rainfallMmMin}–${climate.rainfallMmMax} mm`} />
        )}
        {climate.droughtTolerance && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">Drought tolerance</span>
            <ToleranceBadge level={climate.droughtTolerance} />
          </div>
        )}
        {frostMonths && (
          <Row label="Frost risk months" value={frostMonths} />
        )}
      </Card>
    </div>
  );
}

function EconomicsSection({ economics }: { economics: FruitEconomics }) {
  const hasData = economics.productionTonnesYear != null || economics.exportStatus
    || economics.pricePremiumIndex != null;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader icon="📊" title="Agricultural Economics" />
      <Card>
        {economics.productionTonnesYear != null && (
          <Row
            label="Tunisia production"
            value={`${economics.productionTonnesYear.toLocaleString()} t/yr`}
          />
        )}
        {economics.exportStatus && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">Market status</span>
            <span className={`badge border text-2xs ${EXPORT_STYLES[economics.exportStatus]}`}>
              {EXPORT_LABELS[economics.exportStatus]}
            </span>
          </div>
        )}
        {economics.pricePremiumIndex != null && (
          <Row
            label="Price premium index"
            value={economics.pricePremiumIndex === 1.0
              ? '1.0× (baseline)'
              : `${economics.pricePremiumIndex.toFixed(1)}× market`}
          />
        )}
      </Card>
    </div>
  );
}

function ConservationSection({ conservation }: { conservation: FruitConservation }) {
  const hasData = conservation.status || conservation.knownFarmsCount != null
    || conservation.seedBankStatus != null;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader icon="🛡️" title="Conservation & Genetics" />
      <Card>
        {conservation.status && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">Status</span>
            <ConservationBadge status={conservation.status} />
          </div>
        )}
        {conservation.knownFarmsCount != null && (
          <Row label="Known producing farms" value={conservation.knownFarmsCount.toLocaleString()} />
        )}
        {conservation.seedBankStatus != null && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">INRAT seed bank</span>
            <span className={`badge border text-2xs ${conservation.seedBankStatus
              ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
              : 'bg-slate-100 border-slate-300 text-slate-600'}`}>
              {conservation.seedBankStatus ? 'Preserved' : 'Not registered'}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

function PhenologySection({ phenology }: { phenology: FruitPhenology }) {
  const hasData = phenology.daysFlowerToHarvest != null || phenology.harvestWindowDays != null
    || phenology.pollinatorDependency;
  if (!hasData) return null;
  return (
    <div className="mb-3">
      <SectionHeader icon="🌸" title="Phenology & Timing" />
      <Card>
        {phenology.daysFlowerToHarvest != null && (
          <Row label="Flower → harvest" value={`${phenology.daysFlowerToHarvest} days`} />
        )}
        {phenology.harvestWindowDays != null && (
          <Row label="Harvest window" value={`${phenology.harvestWindowDays} days`} />
        )}
        {phenology.pollinatorDependency && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">Pollination</span>
            <span className="text-xs text-ink">
              {POLLINATOR_ICONS[phenology.pollinatorDependency]}{' '}
              {POLLINATOR_LABELS[phenology.pollinatorDependency]}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

function SustainabilitySection({ sustainability }: { sustainability: FruitSustainability }) {
  const hasData = sustainability.carbonFootprintKgCo2 != null
    || sustainability.postHarvestLossPct != null;
  if (!hasData) return null;

  const co2 = sustainability.carbonFootprintKgCo2;
  const co2Color = co2 == null ? '' : co2 < 1 ? 'text-emerald-700' : co2 < 3 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="mb-3">
      <SectionHeader icon="♻️" title="Carbon & Sustainability" />
      <Card>
        {co2 != null && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-2xs text-ink/80">Carbon footprint</span>
            <span className={`font-mono text-xs font-medium ${co2Color}`}>
              {co2.toFixed(1)} kg CO₂e/kg
            </span>
          </div>
        )}
        {sustainability.postHarvestLossPct != null && (
          <Row
            label="Post-harvest loss"
            value={`${sustainability.postHarvestLossPct}%`}
          />
        )}
      </Card>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface IntelligencePanelProps {
  soil?:          FruitSoil | null;
  climate?:       FruitClimate | null;
  economics?:     FruitEconomics | null;
  conservation?:  FruitConservation | null;
  phenology?:     FruitPhenology | null;
  sustainability?: FruitSustainability | null;
}

export function IntelligencePanel({
  soil, climate, economics, conservation, phenology, sustainability,
}: IntelligencePanelProps) {
  const hasAny = soil || climate || economics || conservation || phenology || sustainability;
  if (!hasAny) return null;

  return (
    <div className="px-4 pb-2">
      <p className="text-2xs text-ink/90 uppercase tracking-wider mb-3 font-semibold">
        Agronomic Intelligence
      </p>
      {soil         && <SoilSection         soil={soil} />}
      {climate      && <ClimateSection      climate={climate} />}
      {economics    && <EconomicsSection    economics={economics} />}
      {conservation && <ConservationSection conservation={conservation} />}
      {phenology    && <PhenologySection    phenology={phenology} />}
      {sustainability && <SustainabilitySection sustainability={sustainability} />}
    </div>
  );
}
