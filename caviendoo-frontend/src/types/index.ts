export type Locale = 'en' | 'fr' | 'ar';

export type LocalizedString = {
  en: string;
  fr: string;
  ar: string;
};

export type FruitCategory =
  | 'citrus'
  | 'stone'
  | 'pomme'
  | 'tropical'
  | 'berry'
  | 'dried'
  | 'melon'
  | 'other';

export type SustainabilityClass = 'low' | 'moderate' | 'high';

export type ToleranceLevel = 'Low' | 'Medium' | 'High';

export type OverlayMode = 'recoltes' | 'stress-hydrique' | 'indice-uv';

export interface SeasonData {
  pre: number[];   // 0-indexed months (0=Jan)
  peak: number[];
  post: number[];
}

export interface NutritionalField {
  label: LocalizedString;
  value: string;
}

export interface FruitEnvironmental {
  blueWaterLkg: number;
  greenWaterLkg: number;
  totalWaterLkg: number;
  aquiferStressPct: number;  // 0–100
  uvMin: number;             // 1–11
  uvMax: number;             // 1–11
  uvPeak: number;            // actual peak during harvest
  uvNote: string;
  sustainabilityClass: SustainabilityClass;
  carbonFootprintKgCo2?: number | null;
}

// ── Agronomic intelligence sub-objects ────────────────────────────────────────

export interface FruitSoil {
  phMin:             number | null;
  phMax:             number | null;
  salinityTolerance: 'low' | 'medium' | 'high' | null;
  types:             string[];
}

export interface FruitClimate {
  chillHoursMin:    number | null;
  rainfallMmMin:    number | null;
  rainfallMmMax:    number | null;
  droughtTolerance: 'low' | 'medium' | 'high' | null;
  frostRiskMonths:  number[];
}

export interface FruitEconomics {
  productionTonnesYear: number | null;
  exportStatus:         'exported' | 'local_only' | 'artisanal_only' | null;
  pricePremiumIndex:    number | null;
}

export interface FruitConservation {
  status:          'common' | 'watch' | 'vulnerable' | 'endangered' | 'critical' | null;
  knownFarmsCount: number | null;
  seedBankStatus:  boolean | null;
}

export interface FruitPhenology {
  daysFlowerToHarvest:  number | null;
  harvestWindowDays:    number | null;
  pollinatorDependency: 'self_fertile' | 'bee_dependent' | 'cross_pollination' | null;
}

export interface FruitSustainability {
  carbonFootprintKgCo2: number | null;
  postHarvestLossPct:   number | null;
}

export interface Fruit {
  id: string;
  name: LocalizedString;
  localName: string;         // Arabic dialect script
  latinName: string;
  category: FruitCategory;
  isAOC: boolean;
  isHeritage: boolean;
  photoUrl: string;
  thumbnailUrl: string;
  season: SeasonData;
  primaryGovernorate: string;  // matches GeoJSON shapeName
  governorates: string[];
  localities: string[];
  zone: LocalizedString;
  description: LocalizedString;
  culturalNotes: LocalizedString;
  nutritional: NutritionalField[];
  environmental: FruitEnvironmental;
  // Agronomic intelligence (nullable — present when seeded/researched)
  soil?:           FruitSoil | null;
  climate?:        FruitClimate | null;
  economics?:      FruitEconomics | null;
  conservation?:   FruitConservation | null;
  phenology?:      FruitPhenology | null;
  sustainability?: FruitSustainability | null;
  tags: string[];
}

export interface Governorate {
  shapeName: string;        // matches GeoJSON shapeName exactly
  shapeISO: string;
  aquiferStressPct: number; // 0–100
  waterLabel: string;
  uvPeak: number;
  uvLabel: string;
  fruitCount: number;       // derived
  description?: string;
  // ISRIC soil data (populated weekly by climate sync job)
  soilPhTypical?:        number | null;
  soilTexture?:          string | null;
  soilOrganicCarbonPct?: number | null;
}

// ── Live API response types ────────────────────────────────────────────────────

export interface WeatherCondition {
  en: string;
  fr: string;
  ar: string;
}

export interface CurrentWeather {
  temperature:   number;
  feelsLike:     number;
  humidity:      number;
  precipitation: number;
  windSpeed:     number;
  uvIndex:       number;
  soilMoisture:  number;
  condition:     WeatherCondition;
  icon:          string;
  timestamp:     string;
}

export interface ClimateClimatology {
  uvIndexPeak:      number;
  uvIndexAnnual:    number;
  tempCMean:        number;
  tempCMax:         number;
  tempCMin:         number;
  precipMmYear:     number;
  humidityPct:      number;
  petMmYear:        number;
  aridityIndex:     number;
  aquiferStressPct: number;
}

export interface BiodiversityData {
  globalOccurrences:  number;
  tunisiaOccurrences: number;
  earliestRecord:     number | null;
  latestRecord:       number | null;
  kingdom:            string | null;
  family:             string | null;
  genus:              string | null;
  taxonKey:           number | null;
  iucnCategory:       string | null;
}

export interface ProductionData {
  itemName:         string;
  productionTonnes: number | null;
  areaHa:           number | null;
  yieldKgHa:        number | null;
  year:             number | null;
  trend:            'up' | 'down' | 'stable' | null;
}

export interface LiveEnvironmentalData {
  blueWaterLkg:     number;
  greenWaterLkg:    number;
  totalWaterLkg:    number;
  aquiferStressPct: number;
  uvIndexPeak:      number;
  uvIndexAnnual:    number;
  precipMmYear:     number;
  tempCMean:        number;
  aridityIndex:     number;
  Kc:               number;
  yieldKgHa:        number;
  dataSource:       string;
}

export interface SiteMetrics {
  totalFruits: number;
  totalGovernorates: number;
  totalAOC: number;
}

export interface FruitFilters {
  category?: FruitCategory;
  aocOnly?: boolean;
  heritageOnly?: boolean;
  governorate?: string;
  searchQuery?: string;
}

// Category badge colours — dark surface variant (used in sidebar on parchment + dark panels)
export const CATEGORY_COLORS: Record<FruitCategory, string> = {
  citrus:   'bg-amber-600 text-white',
  stone:    'bg-rose-700 text-white',
  pomme:    'bg-emerald-700 text-emerald-100',
  tropical: 'bg-purple-700 text-white',
  berry:    'bg-red-800 text-red-100',
  dried:    'bg-amber-800 text-amber-50',
  melon:    'bg-lime-700 text-white',
  other:    'bg-slate-600 text-slate-100',
};

export const CATEGORY_LABELS: Record<FruitCategory, LocalizedString> = {
  citrus: { en: 'Citrus', fr: 'Agrumes', ar: 'حمضيات' },
  stone: { en: 'Stone Fruit', fr: 'Fruits à noyau', ar: 'فواكه نواة' },
  pomme: { en: 'Pome', fr: 'Fruits à pépins', ar: 'تفاحيات' },
  tropical: { en: 'Tropical', fr: 'Tropical', ar: 'استوائي' },
  berry: { en: 'Berry', fr: 'Baie', ar: 'توت' },
  dried: { en: 'Dried / Nut', fr: 'Séché / Noix', ar: 'مجفف / مكسرات' },
  melon: { en: 'Melon', fr: 'Melon', ar: 'بطيخ' },
  other: { en: 'Other', fr: 'Autre', ar: 'أخرى' },
};

export const MONTH_LABELS: Record<Locale, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};
