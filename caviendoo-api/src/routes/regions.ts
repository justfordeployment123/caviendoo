import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';
import { mapFruitToResponse } from '../utils/fruitMapper';
import { HttpError } from '../utils/httpError';

const ListQuerySchema = z.object({
  country: z.string().min(2).max(2).default('TN'),
});

const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const router = Router();

// GET /api/v1/regions?country=TN
router.get('/', validate({ query: ListQuerySchema }), async (req, res, next) => {
  try {
    const { country } = req.query as any;
    const regions = await prisma.governorate.findMany({
      where:   { countryCode: country },
      orderBy: { shapeName: 'asc' },
      include: { _count: { select: { fruits: true } } },
    });
    res.json({
      data: regions.map((g) => ({
        id:               g.id,
        shapeName:        g.shapeName,
        shapeISO:         g.shapeISO,
        countryCode:      g.countryCode,
        aquiferStressPct: g.aquiferStressPct,
        waterLabel:       g.waterLabel,
        uvPeak:           g.uvPeak,
        uvLabel:          g.uvLabel,
        fruitCount:       g._count.fruits,
        centroidLat:      g.centroidLat,
        centroidLng:      g.centroidLng,
        descriptionEn:    g.descriptionEn,
        descriptionFr:    g.descriptionFr,
        descriptionAr:    g.descriptionAr,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/regions/:id/fruits
router.get('/:id/fruits', validate({ params: IdParamSchema }), async (req, res, next) => {
  try {
    const regionId = Number(req.params['id']);
    const gov = await prisma.governorate.findUnique({ where: { id: regionId }, select: { id: true } });
    if (!gov) return next(new HttpError(404, 'Region not found'));

    const fruits = await prisma.fruit.findMany({
      where:   { governorates: { some: { governorateId: regionId } } },
      include: {
        environmental: { include: { region: { select: { shapeName: true } } } },
        images:        { where: { isPrimary: true, status: 'ready' }, take: 1 },
        governorates:  { include: { governorate: { select: { shapeName: true } } } },
      },
      orderBy: { nameEn: 'asc' },
    });

    res.json({ data: fruits.map((f) => mapFruitToResponse(f)) });
  } catch (err) {
    next(err);
  }
});

export default router;
