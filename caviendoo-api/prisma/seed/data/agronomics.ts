/**
 * Agronomic intelligence data for all 73 Tunisian fruits.
 * Sources: FAO crop guides, USDA plant databases, INRAT research,
 * Mediterranean agronomic literature, and FAOSTAT production statistics.
 * All values are nullable — missing data appears silently in the UI.
 */

export interface FruitAgronomics {
  // Soil & land quality
  soilPhMin?:         number;
  soilPhMax?:         number;
  salinityTolerance?: 'low' | 'medium' | 'high';
  soilTypes?:         string[];

  // Climate & temperature
  chillHoursMin?:    number;
  rainfallMmMin?:    number;
  rainfallMmMax?:    number;
  droughtTolerance?: 'low' | 'medium' | 'high';
  frostRiskMonths?:  number[];  // 0-indexed (Jan=0)

  // Agricultural economics
  productionTonnesYear?: number;
  exportStatus?:         'exported' | 'local_only' | 'artisanal_only';
  pricePremiumIndex?:    number;

  // Conservation & genetic status
  conservationStatus?: 'common' | 'watch' | 'vulnerable' | 'endangered' | 'critical';
  knownFarmsCount?:    number;
  seedBankStatus?:     boolean;

  // Phenology & precision timing
  daysFlowerToHarvest?:  number;
  harvestWindowDays?:    number;
  pollinatorDependency?: 'self_fertile' | 'bee_dependent' | 'cross_pollination';

  // Carbon & sustainability
  carbonFootprintKgCo2?: number;
  postHarvestLossPct?:   number;
}

export const agronomics: Record<string, FruitAgronomics> = {

  'olive-chemlali': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'high',
    soilTypes: ['clay', 'loam', 'sandy', 'calcaire'],
    chillHoursMin: 400, rainfallMmMin: 150, rainfallMmMax: 400,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 285000, exportStatus: 'exported', pricePremiumIndex: 1.6,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 185, harvestWindowDays: 50, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 2.4, postHarvestLossPct: 8,
  },

  'date-deglet-noor': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 50, rainfallMmMax: 100,
    droughtTolerance: 'high', frostRiskMonths: [],
    productionTonnesYear: 285000, exportStatus: 'exported', pricePremiumIndex: 2.8,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 180, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.9, postHarvestLossPct: 5,
  },

  'fig-djebba': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['clay', 'loam', 'calcaire'],
    chillHoursMin: 200, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 2400, exportStatus: 'artisanal_only', pricePremiumIndex: 2.2,
    conservationStatus: 'endangered', knownFarmsCount: 120, seedBankStatus: true,
    daysFlowerToHarvest: 90, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 25,
  },

  'pomegranate-gabes': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['clay', 'loam', 'sandy'],
    chillHoursMin: 200, rainfallMmMin: 300, rainfallMmMax: 700,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 74000, exportStatus: 'exported', pricePremiumIndex: 1.4,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 150, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.7, postHarvestLossPct: 15,
  },

  'apricot-sidi-bouzid': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy', 'calcaire'],
    chillHoursMin: 700, rainfallMmMin: 300, rainfallMmMax: 600,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 98000, exportStatus: 'exported', pricePremiumIndex: 1.2,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 60, harvestWindowDays: 14, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'orange-maltaise': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy', 'clay'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 350000, exportStatus: 'exported', pricePremiumIndex: 2.0,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 270, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 12,
  },

  'almond-sfax': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 400, rainfallMmMin: 250, rainfallMmMax: 500,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 63000, exportStatus: 'exported', pricePremiumIndex: 1.3,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 220, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 4.3, postHarvestLossPct: 5,
  },

  'grape-muscat-nabeul': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 800, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 96000, exportStatus: 'exported', pricePremiumIndex: 1.9,
    conservationStatus: 'vulnerable', knownFarmsCount: 800, seedBankStatus: true,
    daysFlowerToHarvest: 120, harvestWindowDays: 21, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.8, postHarvestLossPct: 18,
  },

  'lemon-beldi': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 50000, exportStatus: 'local_only', pricePremiumIndex: 1.5,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 240, harvestWindowDays: 60, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 15,
  },

  'peach-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 900, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 65000, exportStatus: 'exported', pricePremiumIndex: 1.1,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 100, harvestWindowDays: 14, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'olive-chetoui': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'high',
    soilTypes: ['clay', 'loam', 'calcaire'],
    chillHoursMin: 500, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 40000, exportStatus: 'exported', pricePremiumIndex: 1.4,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 180, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 2.6, postHarvestLossPct: 8,
  },

  'date-allig': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 50, rainfallMmMax: 100,
    droughtTolerance: 'high', frostRiskMonths: [],
    productionTonnesYear: 50000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 175, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.9, postHarvestLossPct: 7,
  },

  'strawberry-nabeul': {
    soilPhMin: 5.5, soilPhMax: 7.0,
    salinityTolerance: 'low',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 200, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2],
    productionTonnesYear: 15000, exportStatus: 'exported', pricePremiumIndex: 1.3,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 90, harvestWindowDays: 45, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.6, postHarvestLossPct: 30,
  },

  'watermelon-kairouan': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 300, rainfallMmMax: 600,
    droughtTolerance: 'medium', frostRiskMonths: [],
    productionTonnesYear: 720000, exportStatus: 'local_only', pricePremiumIndex: 0.9,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 80, harvestWindowDays: 21, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 10,
  },

  'cherry-beja': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 1200, rainfallMmMin: 500, rainfallMmMax: 900,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 8000, exportStatus: 'local_only', pricePremiumIndex: 1.8,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 80, harvestWindowDays: 10, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 25,
  },

  'prickly-pear': {
    soilPhMin: 5.5, soilPhMax: 8.0,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'calcaire', 'clay'],
    chillHoursMin: 0, rainfallMmMin: 100, rainfallMmMax: 400,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 600000, exportStatus: 'exported', pricePremiumIndex: 1.0,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 90, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.2, postHarvestLossPct: 15,
  },

  'mandarin-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 120000, exportStatus: 'exported', pricePremiumIndex: 1.1,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 270, harvestWindowDays: 60, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 12,
  },

  'pistachio-kasserine': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 1000, rainfallMmMin: 250, rainfallMmMax: 450,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 2000, exportStatus: 'exported', pricePremiumIndex: 3.0,
    conservationStatus: 'watch', knownFarmsCount: 5000, seedBankStatus: true,
    daysFlowerToHarvest: 200, harvestWindowDays: 14, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 5.5, postHarvestLossPct: 5,
  },

  'plum-beja': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 700, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 15000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 120, harvestWindowDays: 14, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'walnut-beja': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 1000, rainfallMmMin: 500, rainfallMmMax: 900,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 5000, exportStatus: 'local_only', pricePremiumIndex: 1.5,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 150, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 2.3, postHarvestLossPct: 5,
  },

  'apple-el-kef': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 1000, rainfallMmMin: 500, rainfallMmMax: 800,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 48000, exportStatus: 'local_only', pricePremiumIndex: 1.1,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 150, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 10,
  },

  'pear-nefza': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 900, rainfallMmMin: 450, rainfallMmMax: 800,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 18000, exportStatus: 'local_only', pricePremiumIndex: 1.2,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 130, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 15,
  },

  'quince-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 500, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 10000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 150, harvestWindowDays: 21, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 12,
  },

  'carob-kasserine': {
    soilPhMin: 6.5, soilPhMax: 8.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'calcaire', 'loam'],
    chillHoursMin: 200, rainfallMmMin: 250, rainfallMmMax: 600,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 12000, exportStatus: 'exported', pricePremiumIndex: 1.5,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 330, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 10,
  },

  'hazelnut-jendouba': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 1200, rainfallMmMin: 500, rainfallMmMax: 900,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 3000, exportStatus: 'local_only', pricePremiumIndex: 2.0,
    conservationStatus: 'watch', knownFarmsCount: 1000, seedBankStatus: true,
    daysFlowerToHarvest: 120, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.8, postHarvestLossPct: 8,
  },

  'pine-nut-bizerte': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 400, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 1500, exportStatus: 'exported', pricePremiumIndex: 4.0,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 730, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 1.0, postHarvestLossPct: 5,
  },

  'jujube-zaghouan': {
    soilPhMin: 6.0, soilPhMax: 8.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'clay'],
    chillHoursMin: 200, rainfallMmMin: 200, rainfallMmMax: 600,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 5000, exportStatus: 'artisanal_only', pricePremiumIndex: 1.4,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 120, harvestWindowDays: 21, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 20,
  },

  'loquat-cap-bon': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 3000, exportStatus: 'local_only', pricePremiumIndex: 1.3,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 90, harvestWindowDays: 14, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 25,
  },

  'clementine-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 80000, exportStatus: 'exported', pricePremiumIndex: 1.2,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 270, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 12,
  },

  'grapefruit-sousse': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 25000, exportStatus: 'local_only', pricePremiumIndex: 0.9,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 300, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 12,
  },

  'mulberry-beja': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 400, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 2500, exportStatus: 'artisanal_only', pricePremiumIndex: 2.5,
    conservationStatus: 'watch', seedBankStatus: false,
    daysFlowerToHarvest: 60, harvestWindowDays: 14, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 50,
  },

  'date-kentichi': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 50, rainfallMmMax: 100,
    droughtTolerance: 'high', frostRiskMonths: [],
    productionTonnesYear: 30000, exportStatus: 'local_only', pricePremiumIndex: 1.2,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 170, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.9, postHarvestLossPct: 8,
  },

  'olive-zalmati': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'high',
    soilTypes: ['clay', 'loam', 'calcaire'],
    chillHoursMin: 450, rainfallMmMin: 200, rainfallMmMax: 500,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 15000, exportStatus: 'exported', pricePremiumIndex: 1.3,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 185, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 2.5, postHarvestLossPct: 8,
  },

  'melon-gafsa': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 200, rainfallMmMax: 500,
    droughtTolerance: 'medium', frostRiskMonths: [],
    productionTonnesYear: 200000, exportStatus: 'local_only', pricePremiumIndex: 1.1,
    conservationStatus: 'watch', knownFarmsCount: 2000, seedBankStatus: true,
    daysFlowerToHarvest: 75, harvestWindowDays: 14, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 12,
  },

  'lime-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 15000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 240, harvestWindowDays: 60, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 15,
  },

  'blood-orange-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 20000, exportStatus: 'exported', pricePremiumIndex: 1.5,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 275, harvestWindowDays: 30, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 12,
  },

  'bergamot-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 450, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 3000, exportStatus: 'exported', pricePremiumIndex: 3.5,
    conservationStatus: 'vulnerable', knownFarmsCount: 200, seedBankStatus: true,
    daysFlowerToHarvest: 285, harvestWindowDays: 30, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 10,
  },

  'pomelo-tunis': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 5000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 300, harvestWindowDays: 30, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 10,
  },

  'bitter-orange-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['loam', 'sandy', 'clay'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 8000, exportStatus: 'exported', pricePremiumIndex: 2.0,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 280, harvestWindowDays: 30, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 15,
  },

  'nectarine-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 800, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 40000, exportStatus: 'exported', pricePremiumIndex: 1.2,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 100, harvestWindowDays: 14, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 18,
  },

  'persimmon-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 200, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 5000, exportStatus: 'local_only', pricePremiumIndex: 1.5,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 180, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 15,
  },

  'apricot-kairouan': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy', 'calcaire'],
    chillHoursMin: 600, rainfallMmMin: 300, rainfallMmMax: 600,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 98000, exportStatus: 'exported', pricePremiumIndex: 1.1,
    conservationStatus: 'watch', knownFarmsCount: 3000, seedBankStatus: true,
    daysFlowerToHarvest: 65, harvestWindowDays: 14, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'peach-zaghouan': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 850, rainfallMmMin: 350, rainfallMmMax: 650,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 65000, exportStatus: 'exported', pricePremiumIndex: 1.1,
    conservationStatus: 'watch', knownFarmsCount: 2000, seedBankStatus: true,
    daysFlowerToHarvest: 100, harvestWindowDays: 14, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'plum-siliana': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 700, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 15000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'watch', knownFarmsCount: 1500, seedBankStatus: true,
    daysFlowerToHarvest: 120, harvestWindowDays: 14, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'apple-siliana': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 1100, rainfallMmMin: 500, rainfallMmMax: 800,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 48000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 155, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 10,
  },

  'pear-zaghouan': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 800, rainfallMmMin: 450, rainfallMmMax: 750,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 18000, exportStatus: 'local_only', pricePremiumIndex: 1.1,
    conservationStatus: 'watch', knownFarmsCount: 1200, seedBankStatus: true,
    daysFlowerToHarvest: 135, harvestWindowDays: 14, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.4, postHarvestLossPct: 12,
  },

  'banana-gabes': {
    soilPhMin: 5.5, soilPhMax: 7.0,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 0, rainfallMmMin: 500, rainfallMmMax: 1000,
    droughtTolerance: 'low', frostRiskMonths: [],
    productionTonnesYear: 8000, exportStatus: 'local_only', pricePremiumIndex: 1.2,
    conservationStatus: 'watch', knownFarmsCount: 500, seedBankStatus: false,
    daysFlowerToHarvest: 270, harvestWindowDays: 30, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.7, postHarvestLossPct: 20,
  },

  'kiwi-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 800, rainfallMmMin: 500, rainfallMmMax: 900,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 1000, exportStatus: 'local_only', pricePremiumIndex: 1.5,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 180, harvestWindowDays: 30, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 0.7, postHarvestLossPct: 15,
  },

  'avocado-gabes': {
    soilPhMin: 6.0, soilPhMax: 7.0,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 0, rainfallMmMin: 600, rainfallMmMax: 1000,
    droughtTolerance: 'low', frostRiskMonths: [],
    productionTonnesYear: 2000, exportStatus: 'local_only', pricePremiumIndex: 2.0,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 365, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 2.5, postHarvestLossPct: 15,
  },

  'guava-monastir': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['loam', 'sandy', 'clay'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'medium', frostRiskMonths: [],
    productionTonnesYear: 3000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 150, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'prickly-pear-sfax': {
    soilPhMin: 5.5, soilPhMax: 8.0,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'calcaire', 'clay'],
    chillHoursMin: 0, rainfallMmMin: 100, rainfallMmMax: 400,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 600000, exportStatus: 'exported', pricePremiumIndex: 1.0,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 90, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.2, postHarvestLossPct: 15,
  },

  'raspberry-beja': {
    soilPhMin: 5.5, soilPhMax: 6.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 800, rainfallMmMin: 500, rainfallMmMax: 900,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 1000, exportStatus: 'artisanal_only', pricePremiumIndex: 3.0,
    conservationStatus: 'watch', knownFarmsCount: 150, seedBankStatus: false,
    daysFlowerToHarvest: 70, harvestWindowDays: 21, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.6, postHarvestLossPct: 35,
  },

  'blackberry-jendouba': {
    soilPhMin: 5.5, soilPhMax: 7.0,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy', 'clay'],
    chillHoursMin: 700, rainfallMmMin: 500, rainfallMmMax: 900,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 500, exportStatus: 'artisanal_only', pricePremiumIndex: 3.5,
    conservationStatus: 'watch', knownFarmsCount: 80, seedBankStatus: false,
    daysFlowerToHarvest: 90, harvestWindowDays: 21, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 40,
  },

  'blueberry-siliana': {
    soilPhMin: 4.5, soilPhMax: 5.5,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'sandy'],
    chillHoursMin: 1000, rainfallMmMin: 500, rainfallMmMax: 800,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 200, exportStatus: 'artisanal_only', pricePremiumIndex: 4.0,
    conservationStatus: 'watch', knownFarmsCount: 30, seedBankStatus: false,
    daysFlowerToHarvest: 80, harvestWindowDays: 21, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.8, postHarvestLossPct: 30,
  },

  'currant-beja': {
    soilPhMin: 5.5, soilPhMax: 7.0,
    salinityTolerance: 'low',
    soilTypes: ['loam', 'clay'],
    chillHoursMin: 800, rainfallMmMin: 500, rainfallMmMax: 800,
    droughtTolerance: 'low', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 500, exportStatus: 'artisanal_only', pricePremiumIndex: 3.5,
    conservationStatus: 'watch', knownFarmsCount: 50, seedBankStatus: false,
    daysFlowerToHarvest: 90, harvestWindowDays: 14, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.6, postHarvestLossPct: 30,
  },

  'date-nour': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 50, rainfallMmMax: 100,
    droughtTolerance: 'high', frostRiskMonths: [],
    productionTonnesYear: 20000, exportStatus: 'local_only', pricePremiumIndex: 1.5,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 175, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.9, postHarvestLossPct: 7,
  },

  'date-ftimi': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 50, rainfallMmMax: 100,
    droughtTolerance: 'high', frostRiskMonths: [],
    productionTonnesYear: 25000, exportStatus: 'exported', pricePremiumIndex: 1.3,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 180, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.9, postHarvestLossPct: 6,
  },

  'almond-achaak': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 350, rainfallMmMin: 200, rainfallMmMax: 450,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 63000, exportStatus: 'exported', pricePremiumIndex: 1.4,
    conservationStatus: 'watch', knownFarmsCount: 5000, seedBankStatus: true,
    daysFlowerToHarvest: 215, harvestWindowDays: 21, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 4.3, postHarvestLossPct: 5,
  },

  'pistachio-gafsa': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 900, rainfallMmMin: 200, rainfallMmMax: 400,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 2000, exportStatus: 'exported', pricePremiumIndex: 3.2,
    conservationStatus: 'vulnerable', knownFarmsCount: 2000, seedBankStatus: true,
    daysFlowerToHarvest: 195, harvestWindowDays: 14, pollinatorDependency: 'cross_pollination',
    carbonFootprintKgCo2: 5.5, postHarvestLossPct: 5,
  },

  'watermelon-sousse': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 350, rainfallMmMax: 600,
    droughtTolerance: 'medium', frostRiskMonths: [],
    productionTonnesYear: 720000, exportStatus: 'local_only', pricePremiumIndex: 0.9,
    conservationStatus: 'common', seedBankStatus: false,
    daysFlowerToHarvest: 80, harvestWindowDays: 21, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 10,
  },

  'melon-mahdia': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 300, rainfallMmMax: 600,
    droughtTolerance: 'medium', frostRiskMonths: [],
    productionTonnesYear: 200000, exportStatus: 'local_only', pricePremiumIndex: 1.1,
    conservationStatus: 'watch', knownFarmsCount: 1500, seedBankStatus: true,
    daysFlowerToHarvest: 80, harvestWindowDays: 14, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 12,
  },

  'melon-nabeul': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 400, rainfallMmMax: 700,
    droughtTolerance: 'low', frostRiskMonths: [],
    productionTonnesYear: 200000, exportStatus: 'exported', pricePremiumIndex: 1.2,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 75, harvestWindowDays: 14, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 12,
  },

  'grape-razegui': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 750, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 96000, exportStatus: 'exported', pricePremiumIndex: 1.8,
    conservationStatus: 'watch', knownFarmsCount: 600, seedBankStatus: true,
    daysFlowerToHarvest: 130, harvestWindowDays: 21, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.8, postHarvestLossPct: 18,
  },

  'grape-beldi': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 700, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 2, 11],
    productionTonnesYear: 96000, exportStatus: 'local_only', pricePremiumIndex: 1.5,
    conservationStatus: 'watch', knownFarmsCount: 400, seedBankStatus: true,
    daysFlowerToHarvest: 120, harvestWindowDays: 21, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 0.8, postHarvestLossPct: 18,
  },

  'olive-meski': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'high',
    soilTypes: ['loam', 'calcaire', 'sandy'],
    chillHoursMin: 350, rainfallMmMin: 200, rainfallMmMax: 500,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 30000, exportStatus: 'exported', pricePremiumIndex: 1.5,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 175, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 2.4, postHarvestLossPct: 8,
  },

  'olive-tounsi': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'high',
    soilTypes: ['loam', 'clay', 'calcaire'],
    chillHoursMin: 400, rainfallMmMin: 250, rainfallMmMax: 600,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 20000, exportStatus: 'artisanal_only', pricePremiumIndex: 1.8,
    conservationStatus: 'vulnerable', knownFarmsCount: 1500, seedBankStatus: true,
    daysFlowerToHarvest: 185, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 2.6, postHarvestLossPct: 8,
  },

  'olive-jerbi': {
    soilPhMin: 6.0, soilPhMax: 8.0,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'calcaire', 'loam'],
    chillHoursMin: 300, rainfallMmMin: 150, rainfallMmMax: 350,
    droughtTolerance: 'high', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 25000, exportStatus: 'artisanal_only', pricePremiumIndex: 2.0,
    conservationStatus: 'vulnerable', knownFarmsCount: 800, seedBankStatus: true,
    daysFlowerToHarvest: 190, harvestWindowDays: 45, pollinatorDependency: 'self_fertile',
    carbonFootprintKgCo2: 2.5, postHarvestLossPct: 8,
  },

  'fig-beni-khalled': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['sandy', 'loam', 'calcaire'],
    chillHoursMin: 200, rainfallMmMin: 400, rainfallMmMax: 800,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 5000, exportStatus: 'exported', pricePremiumIndex: 1.8,
    conservationStatus: 'watch', knownFarmsCount: 300, seedBankStatus: true,
    daysFlowerToHarvest: 90, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 25,
  },

  'pomegranate-tebourba': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['loam', 'clay', 'sandy'],
    chillHoursMin: 200, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 74000, exportStatus: 'local_only', pricePremiumIndex: 1.2,
    conservationStatus: 'watch', knownFarmsCount: 1000, seedBankStatus: true,
    daysFlowerToHarvest: 150, harvestWindowDays: 21, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.7, postHarvestLossPct: 15,
  },

  'caper-gabes': {
    soilPhMin: 6.5, soilPhMax: 8.5,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'calcaire', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 100, rainfallMmMax: 400,
    droughtTolerance: 'high', frostRiskMonths: [0, 11],
    productionTonnesYear: 8000, exportStatus: 'exported', pricePremiumIndex: 3.5,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 60, harvestWindowDays: 60, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 20,
  },

  'date-chekhi': {
    soilPhMin: 7.0, soilPhMax: 8.5,
    salinityTolerance: 'high',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 50, rainfallMmMax: 100,
    droughtTolerance: 'high', frostRiskMonths: [],
    productionTonnesYear: 15000, exportStatus: 'local_only', pricePremiumIndex: 1.1,
    conservationStatus: 'watch', seedBankStatus: true,
    daysFlowerToHarvest: 180, harvestWindowDays: 30, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.9, postHarvestLossPct: 8,
  },

  'fig-smyrna': {
    soilPhMin: 5.5, soilPhMax: 7.5,
    salinityTolerance: 'medium',
    soilTypes: ['loam', 'sandy', 'calcaire'],
    chillHoursMin: 200, rainfallMmMin: 350, rainfallMmMax: 700,
    droughtTolerance: 'medium', frostRiskMonths: [0, 1, 11],
    productionTonnesYear: 55000, exportStatus: 'exported', pricePremiumIndex: 1.5,
    conservationStatus: 'common', seedBankStatus: true,
    daysFlowerToHarvest: 85, harvestWindowDays: 21, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.5, postHarvestLossPct: 30,
  },

  'melon-kasserine': {
    soilPhMin: 6.0, soilPhMax: 7.5,
    salinityTolerance: 'low',
    soilTypes: ['sandy', 'loam'],
    chillHoursMin: 0, rainfallMmMin: 250, rainfallMmMax: 500,
    droughtTolerance: 'medium', frostRiskMonths: [],
    productionTonnesYear: 200000, exportStatus: 'local_only', pricePremiumIndex: 1.0,
    conservationStatus: 'watch', knownFarmsCount: 800, seedBankStatus: true,
    daysFlowerToHarvest: 80, harvestWindowDays: 14, pollinatorDependency: 'bee_dependent',
    carbonFootprintKgCo2: 0.3, postHarvestLossPct: 12,
  },

};
