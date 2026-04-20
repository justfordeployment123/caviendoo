import type {
  Fruit as DBFruit,
  FruitEnvironmental,
  NutritionalField,
  FruitImage,
  FruitGovernorate,
  Governorate,
} from '@prisma/client';

type DBFruitWithRelations = DBFruit & {
  environmental?: FruitEnvironmental | null;
  nutritional?: NutritionalField[];
  images?: FruitImage[];
  governorates?: (FruitGovernorate & { governorate: Governorate })[];
};

interface MapOptions {
  full?: boolean;
}

export function mapFruitToResponse(fruit: DBFruitWithRelations, opts: MapOptions = {}) {
  const primaryImage =
    fruit.images?.find((i) => i.isPrimary && i.status === 'ready') ??
    fruit.images?.find((i) => i.status === 'ready');

  const governorateNames =
    fruit.governorates?.map((fg) => fg.governorate.shapeName) ?? [];

  return {
    id: fruit.id,
    name: { en: fruit.nameEn, fr: fruit.nameFr, ar: fruit.nameAr },
    localName: fruit.localName,
    latinName: fruit.latinName,
    category: fruit.category,
    isAOC: fruit.isAOC,
    isHeritage: fruit.isHeritage,
    photoUrl: primaryImage?.cdnUrlHero ?? '/placeholder-hero.webp',
    thumbnailUrl: primaryImage?.cdnUrlThumb ?? '/placeholder-thumb.webp',
    season: {
      pre: fruit.seasonPre,
      peak: fruit.seasonPeak,
      post: fruit.seasonPost,
    },
    primaryGovernorate: fruit.primaryGovernorate,
    governorates: governorateNames,
    localities: fruit.localities,
    zone: { en: fruit.zoneEn, fr: fruit.zoneFr, ar: fruit.zoneAr },
    description: {
      en: fruit.descriptionEn,
      fr: fruit.descriptionFr,
      ar: fruit.descriptionAr,
    },
    culturalNotes: {
      en: fruit.culturalNotesEn,
      fr: fruit.culturalNotesFr,
      ar: fruit.culturalNotesAr,
    },
    nutritional: opts.full
      ? (fruit.nutritional ?? []).map((n) => ({
          label: { en: n.labelEn, fr: n.labelFr, ar: n.labelAr },
          value: n.value,
        }))
      : [],
    environmental: fruit.environmental
      ? {
          blueWaterLkg: fruit.environmental.blueWaterLkg,
          greenWaterLkg: fruit.environmental.greenWaterLkg,
          totalWaterLkg: fruit.environmental.totalWaterLkg,
          aquiferStressPct: fruit.environmental.aquiferStressPct,
          uvMin: fruit.environmental.uvMin,
          uvMax: fruit.environmental.uvMax,
          uvPeak: fruit.environmental.uvPeak,
          uvNote: fruit.environmental.uvNote,
          sustainabilityClass: fruit.environmental.sustainabilityClass,
        }
      : null,
    tags: fruit.tags,
  };
}

export function mapGovernorateToResponse(gov: Governorate) {
  return {
    shapeName: gov.shapeName,
    shapeISO: gov.shapeISO,
    aquiferStressPct: gov.aquiferStressPct,
    waterLabel: gov.waterLabel,
    uvPeak: gov.uvPeak,
    uvLabel: gov.uvLabel,
    fruitCount: 0, // enriched by query
    description: gov.descriptionEn ?? undefined,
  };
}
