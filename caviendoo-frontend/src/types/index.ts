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
  description?: string;     // short governorate summary (optional)
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
