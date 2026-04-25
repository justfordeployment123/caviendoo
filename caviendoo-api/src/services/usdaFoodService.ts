/**
 * USDA FoodData Central — world's most comprehensive nutritional database.
 * https://fdc.nal.usda.gov/
 * Requires USDA_API_KEY env var (free registration at api.nal.usda.gov).
 */

import { env } from '../config/env';

export interface NutrientField {
  label: { en: string; fr: string; ar: string };
  value: string;
  sortOrder: number;
}

// Nutrient IDs to extract, in display order
const WANTED_NUTRIENTS: { id: number; en: string; fr: string; ar: string; unit: string }[] = [
  { id: 1008, en: 'Energy',        fr: 'Énergie',          ar: 'طاقة',           unit: 'kcal' },
  { id: 1003, en: 'Protein',       fr: 'Protéines',        ar: 'بروتين',         unit: 'g' },
  { id: 1005, en: 'Carbohydrates', fr: 'Glucides',         ar: 'كربوهيدرات',     unit: 'g' },
  { id: 1079, en: 'Dietary Fiber', fr: 'Fibres',           ar: 'ألياف غذائية',   unit: 'g' },
  { id: 2000, en: 'Sugars',        fr: 'Sucres',           ar: 'سكريات',         unit: 'g' },
  { id: 1004, en: 'Total Fat',     fr: 'Matières grasses', ar: 'دهون',           unit: 'g' },
  { id: 1162, en: 'Vitamin C',     fr: 'Vitamine C',       ar: 'فيتامين ج',      unit: 'mg' },
  { id: 1087, en: 'Calcium',       fr: 'Calcium',          ar: 'كالسيوم',        unit: 'mg' },
  { id: 1089, en: 'Iron',          fr: 'Fer',              ar: 'حديد',           unit: 'mg' },
  { id: 1092, en: 'Potassium',     fr: 'Potassium',        ar: 'بوتاسيوم',       unit: 'mg' },
  { id: 1105, en: 'Vitamin A',     fr: 'Vitamine A',       ar: 'فيتامين أ',      unit: 'µg' },
  { id: 1175, en: 'Vitamin B6',    fr: 'Vitamine B6',      ar: 'فيتامين ب6',     unit: 'mg' },
  { id: 1114, en: 'Vitamin D',     fr: 'Vitamine D',       ar: 'فيتامين د',      unit: 'µg' },
  { id: 1109, en: 'Vitamin E',     fr: 'Vitamine E',       ar: 'فيتامين هـ',     unit: 'mg' },
  { id: 1185, en: 'Vitamin K',     fr: 'Vitamine K',       ar: 'فيتامين ك',      unit: 'µg' },
  { id: 1170, en: 'Folate',        fr: 'Folate',           ar: 'حمض الفوليك',    unit: 'µg' },
  { id: 1293, en: 'Saturated Fat', fr: 'Graisses saturées', ar: 'دهون مشبعة',    unit: 'g' },
  { id: 1253, en: 'Cholesterol',   fr: 'Cholestérol',      ar: 'كوليسترول',      unit: 'mg' },
  { id: 1093, en: 'Sodium',        fr: 'Sodium',           ar: 'صوديوم',         unit: 'mg' },
  { id: 1091, en: 'Phosphorus',    fr: 'Phosphore',        ar: 'فوسفور',         unit: 'mg' },
  { id: 1090, en: 'Magnesium',     fr: 'Magnésium',        ar: 'مغنيسيوم',       unit: 'mg' },
  { id: 1095, en: 'Zinc',          fr: 'Zinc',             ar: 'زنك',            unit: 'mg' },
];

export async function getNutritionByName(fruitNameEn: string): Promise<NutrientField[] | null> {
  const apiKey = (env as any).USDA_API_KEY as string | undefined;
  if (!apiKey || apiKey === 'CHANGE_ME') {
    console.warn('[usda] USDA_API_KEY not set — skipping nutritional lookup');
    return null;
  }

  // Try "raw" first, then plain name
  const queries = [`${fruitNameEn} raw`, fruitNameEn, `${fruitNameEn} fresh`];

  for (const query of queries) {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=5&api_key=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) continue;

    const json  = await res.json() as any;
    const foods = json.foods as any[];
    if (!foods?.length) continue;

    // Prefer Foundation or SR Legacy food with "raw" in description
    const best = foods.find((f) => f.description?.toLowerCase().includes('raw'))
      ?? foods[0];

    const nutrientMap = new Map<number, number>();
    for (const n of (best.foodNutrients ?? [])) {
      if (n.nutrientId && n.value != null) {
        nutrientMap.set(n.nutrientId, n.value);
      }
    }

    const fields: NutrientField[] = [];
    for (let i = 0; i < WANTED_NUTRIENTS.length; i++) {
      const def = WANTED_NUTRIENTS[i]!;
      const val = nutrientMap.get(def.id);
      if (val == null) continue;
      const rounded = val < 10 ? Math.round(val * 10) / 10 : Math.round(val);
      fields.push({
        label:     { en: def.en, fr: def.fr, ar: def.ar },
        value:     `${rounded} ${def.unit}`,
        sortOrder: i,
      });
    }

    if (fields.length > 0) return fields;
  }

  return null;
}
