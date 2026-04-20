import { z } from 'zod';

const FRUIT_CATEGORIES = ['citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other'] as const;
const SUSTAINABILITY = ['low', 'moderate', 'high'] as const;

export const FruitQuerySchema = z.object({
  category:     z.enum(FRUIT_CATEGORIES).optional(),
  aocOnly:      z.coerce.boolean().optional(),
  heritageOnly: z.coerce.boolean().optional(),
  governorate:  z.string().max(100).optional(),
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(50),
});

export const FruitParamSchema = z.object({
  id: z.string().min(1).max(100),
});

export const LocalizedStringSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
  ar: z.string().min(1),
});

export const EnvironmentalSchema = z.object({
  blueWaterLkg:        z.number().nonnegative(),
  greenWaterLkg:       z.number().nonnegative(),
  totalWaterLkg:       z.number().nonnegative(),
  aquiferStressPct:    z.number().int().min(0).max(100),
  uvMin:               z.number().int().min(1).max(11),
  uvMax:               z.number().int().min(1).max(11),
  uvPeak:              z.number().int().min(1).max(11),
  uvNote:              z.string().max(500),
  sustainabilityClass: z.enum(SUSTAINABILITY),
});

export const NutritionalFieldSchema = z.object({
  labelEn: z.string().min(1).max(100),
  labelFr: z.string().min(1).max(100),
  labelAr: z.string().min(1).max(100),
  value:   z.string().min(1).max(50),
});

export const FruitCoreSchema = z.object({
  id:                 z.string().regex(/^[a-z0-9-]+$/, 'ID must be kebab-case').min(1).max(80),
  nameEn:             z.string().min(1).max(150),
  nameFr:             z.string().min(1).max(150),
  nameAr:             z.string().min(1).max(150),
  localName:          z.string().max(150),
  latinName:          z.string().max(150),
  category:           z.enum(FRUIT_CATEGORIES),
  isAOC:              z.boolean().default(false),
  isHeritage:         z.boolean().default(false),
  primaryGovernorate: z.string().min(1).max(100),
  seasonPre:          z.array(z.number().int().min(0).max(11)),
  seasonPeak:         z.array(z.number().int().min(0).max(11)),
  seasonPost:         z.array(z.number().int().min(0).max(11)),
  descriptionEn:      z.string().max(5000),
  descriptionFr:      z.string().max(5000),
  descriptionAr:      z.string().max(5000),
  culturalNotesEn:    z.string().max(5000),
  culturalNotesFr:    z.string().max(5000),
  culturalNotesAr:    z.string().max(5000),
  zoneEn:             z.string().max(200),
  zoneFr:             z.string().max(200),
  zoneAr:             z.string().max(200),
  localities:         z.array(z.string().max(100)).default([]),
  tags:               z.array(z.string().max(50)).default([]),
});

export type FruitQuery = z.infer<typeof FruitQuerySchema>;
