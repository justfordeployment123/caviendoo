import { z } from 'zod';
import { FruitCoreSchema, EnvironmentalSchema, NutritionalFieldSchema } from './fruitSchemas';

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const FruitCreateSchema = FruitCoreSchema.extend({
  environmental:   EnvironmentalSchema.optional(),
  nutritional:     z.array(NutritionalFieldSchema).default([]),
  governorateNames: z.array(z.string()).default([]),
});

export const FruitUpdateSchema = FruitCoreSchema.partial().omit({ id: true }).extend({
  environmental:   EnvironmentalSchema.partial().optional(),
  nutritional:     z.array(NutritionalFieldSchema).optional(),
  governorateNames: z.array(z.string()).optional(),
});

export const GovernorateUpdateSchema = z.object({
  aquiferStressPct: z.number().int().min(0).max(100).optional(),
  waterLabel:       z.string().max(100).optional(),
  uvPeak:           z.number().int().min(1).max(11).optional(),
  uvLabel:          z.string().max(100).optional(),
  descriptionEn:    z.string().max(2000).optional(),
  descriptionFr:    z.string().max(2000).optional(),
  descriptionAr:    z.string().max(2000).optional(),
  centroidLat:      z.number().min(-90).max(90).optional(),
  centroidLng:      z.number().min(-180).max(180).optional(),
});

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const IntIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type FruitCreateInput = z.infer<typeof FruitCreateSchema>;
export type FruitUpdateInput = z.infer<typeof FruitUpdateSchema>;
