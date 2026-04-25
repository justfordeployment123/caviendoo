/**
 * FAOSTAT API — UN Food and Agriculture Organization statistics.
 * https://fenixservices.fao.org/faostat/api/v1
 * Free, no API key required.
 */

export interface ProductionData {
  itemName:        string;
  productionTonnes: number | null;
  areaHa:          number | null;
  yieldKgHa:       number | null;
  year:            number | null;
  trend:           'up' | 'down' | 'stable' | null;
}

// FAO crop coefficient by category (FAO-56 Kc_mid) — used for water footprint calc
export const CROP_KC: Record<string, number> = {
  citrus:   0.70,
  stone:    1.15,
  pomme:    1.05,
  tropical: 1.00,
  berry:    1.05,
  dried:    0.95,
  melon:    1.05,
  other:    0.85,
};

// FAO default yields (kg/ha) when FAOSTAT data unavailable — from FAO crop guides
export const DEFAULT_YIELD_KG_HA: Record<string, number> = {
  citrus:   15000,
  stone:    8000,
  pomme:    12000,
  tropical: 10000,
  berry:    5000,
  dried:    3000,
  melon:    20000,
  other:    8000,
};

// FAOSTAT item code lookup by Latin name keywords & English name
const ITEM_CODES: { keywords: string[]; code: string; name: string; defaultYield?: number }[] = [
  { keywords: ['dactylifera', 'date'],              code: '577',  name: 'Dates',                    defaultYield: 5000  },
  { keywords: ['europaea', 'oliv'],                 code: '260',  name: 'Olives',                   defaultYield: 3000  },
  { keywords: ['sinensis', 'reticulata', 'orange', 'mandarin', 'clementine'], code: '490', name: 'Oranges', defaultYield: 15000 },
  { keywords: ['limon', 'lemon', 'lime'],           code: '497',  name: 'Lemons and limes',         defaultYield: 12000 },
  { keywords: ['carica', 'fig'],                    code: '620',  name: 'Figs',                     defaultYield: 5000  },
  { keywords: ['granatum', 'pomegranate', 'grenade'], code: '625', name: 'Pomegranates',            defaultYield: 8000  },
  { keywords: ['vinifera', 'grape', 'raisin'],      code: '560',  name: 'Grapes',                   defaultYield: 9000  },
  { keywords: ['persica', 'peach', 'nectarine'],    code: '534',  name: 'Peaches and nectarines',   defaultYield: 8000  },
  { keywords: ['armeniaca', 'apricot', 'abricot'],  code: '526',  name: 'Apricots',                 defaultYield: 6000  },
  { keywords: ['dulcis', 'communis', 'almond'],     code: '221',  name: 'Almonds, with shell',      defaultYield: 1500  },
  { keywords: ['vera', 'pistachio', 'pistache'],    code: '234',  name: 'Pistachios, in shell',     defaultYield: 1200  },
  { keywords: ['domestica', 'plum', 'prune'],       code: '536',  name: 'Plums and sloes',          defaultYield: 7000  },
  { keywords: ['melo', 'cantaloupe', 'melon'],      code: '567',  name: 'Cantaloupes and other melons', defaultYield: 20000 },
  { keywords: ['lanatus', 'watermelon'],            code: '568',  name: 'Watermelons',              defaultYield: 25000 },
  { keywords: ['fragaria', 'strawberry', 'fraise'], code: '268',  name: 'Strawberries',             defaultYield: 8000  },
  { keywords: ['guajava', 'guava'],                 code: '600',  name: 'Guavas',                   defaultYield: 6000  },
  { keywords: ['avocado', 'persea'],                code: '572',  name: 'Avocados',                 defaultYield: 7000  },
  { keywords: ['annona', 'cherimoya'],              code: '603',  name: 'Other tropical fruits NES', defaultYield: 5000 },
  { keywords: ['reticulate', 'junos', 'aurantifolia'], code: '490', name: 'Citrus NES',             defaultYield: 12000 },
  { keywords: ['cerasus', 'cherry', 'cerise'],      code: '531',  name: 'Cherries',                 defaultYield: 5000  },
  { keywords: ['carob', 'siliqua'],                 code: '461',  name: 'Carobs',                   defaultYield: 3000  },
  { keywords: ['jujube', 'ziziphus'],               code: '600',  name: 'Other fruits NES',         defaultYield: 4000  },
  { keywords: ['cactus', 'opuntia', 'prickly pear'], code: '600', name: 'Prickly pears',            defaultYield: 8000  },
];

function findItemCode(latinName: string, nameEn?: string): { code: string; name: string; defaultYield?: number } | null {
  const search = `${latinName} ${nameEn ?? ''}`.toLowerCase();
  for (const item of ITEM_CODES) {
    if (item.keywords.some((kw) => search.includes(kw))) {
      return item;
    }
  }
  return null;
}

export async function getProductionData(
  latinName: string,
  nameEn?:   string,
): Promise<ProductionData> {
  const item = findItemCode(latinName, nameEn);
  if (!item) {
    return { itemName: nameEn ?? latinName, productionTonnes: null, areaHa: null, yieldKgHa: null, year: null, trend: null };
  }

  // FAOSTAT REST API was decommissioned in 2024 — all endpoints return 521/404.
  // Fall back to seeded default yield values; production/area/trend will be null.
  // TODO: replace with FAOSTAT bulk CSV download or alternative source when available.
  const rows: any[] = [];

  // Group by year
  const byYear: Record<number, Record<string, number>> = {};
  for (const row of rows) {
    const yr  = Number(row.Year);
    const el  = row.Element; // 'Production', 'Area harvested', 'Yield'
    const val = Number(row.Value);
    if (!byYear[yr]) byYear[yr] = {};
    byYear[yr][el] = val;
  }

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  if (!years.length) {
    return { itemName: item.name, productionTonnes: null, areaHa: null, yieldKgHa: item.defaultYield ?? null, year: null, trend: null };
  }

  const latest     = byYear[years[0]!]!;
  const prev       = years[1] != null ? byYear[years[1]!] ?? null : null;
  const production = latest['Production'] ?? null;
  const area       = latest['Area harvested'] ?? null;
  const yieldVal   = latest['Yield'] ?? null; // kg/ha in FAOSTAT

  let trend: 'up' | 'down' | 'stable' | null = null;
  if (prev && production != null && prev['Production'] != null) {
    const delta = (production - prev['Production']) / Math.max(prev['Production'], 1);
    trend = delta >  0.02 ? 'up' : delta < -0.02 ? 'down' : 'stable';
  }

  return {
    itemName:        item.name,
    productionTonnes: production,
    areaHa:          area,
    yieldKgHa:       yieldVal ?? item.defaultYield ?? null,
    year:            years[0] ?? null,
    trend,
  };
}

export function getCropKc(category: string, latinName: string): number {
  const search = latinName.toLowerCase();
  if (search.includes('europaea'))   return 0.65; // olive — very drought tolerant
  if (search.includes('dactylifera')) return 1.00; // date palm
  if (search.includes('vinifera'))   return 0.85; // grapes
  if (search.includes('fragaria'))   return 1.05; // strawberry
  if (search.includes('armeniaca'))  return 1.10; // apricot
  if (search.includes('persica'))    return 1.20; // peach
  return CROP_KC[category] ?? 0.85;
}
