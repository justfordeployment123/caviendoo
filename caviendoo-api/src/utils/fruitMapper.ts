import type {
  Fruit as DBFruit,
  FruitEnvironmental,
  NutritionalField,
  FruitImage,
  FruitGovernorate,
  Governorate,
} from '@prisma/client';

type DBFruitWithRelations = DBFruit & {
  environmental?: (FruitEnvironmental & { region?: { shapeName: string } | null })[];
  nutritional?: NutritionalField[];
  images?: FruitImage[];
  governorates?: (FruitGovernorate & { governorate: { shapeName: string } })[];
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

  const env =
    fruit.environmental?.find((e) => e.region?.shapeName === fruit.primaryGovernorate) ??
    fruit.environmental?.[0] ??
    null;

  return {
    id: fruit.id,
    name: { en: fruit.nameEn, fr: fruit.nameFr, ar: fruit.nameAr },
    localName: fruit.localName,
    latinName: fruit.latinName,
    category: fruit.category,
    isAOC: fruit.isAOC,
    isHeritage: fruit.isHeritage,
    photoUrl:     primaryImage?.cdnUrlHero  ?? 'https://placehold.co/800x500/141714/f0e6cc?text=Caviendoo',
    thumbnailUrl: primaryImage?.cdnUrlThumb ?? 'https://placehold.co/168x168/141714/f0e6cc?text=C',
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
    environmental: env
      ? {
          blueWaterLkg:        env.blueWaterLkg,
          greenWaterLkg:       env.greenWaterLkg,
          totalWaterLkg:       env.totalWaterLkg,
          aquiferStressPct:    env.aquiferStressPct,
          uvMin:               env.uvMin,
          uvMax:               env.uvMax,
          uvPeak:              env.uvPeak,
          uvNote:              env.uvNote,
          sustainabilityClass: env.sustainabilityClass,
        }
      : null,
    tags: fruit.tags,
  };
}

export function mapGovernorateToResponse(gov: Governorate) {
  return {
    shapeName:        gov.shapeName,
    shapeISO:         gov.shapeISO,
    aquiferStressPct: gov.aquiferStressPct,
    waterLabel:       gov.waterLabel,
    uvPeak:           gov.uvPeak,
    uvLabel:          gov.uvLabel,
    fruitCount:       0,
    description:      gov.descriptionEn ?? undefined,
  };
}
