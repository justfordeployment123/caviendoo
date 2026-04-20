import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';
import { HttpError } from '../utils/httpError';

const ShapeNameParamSchema = z.object({
  shapeName: z.string().min(1).max(100),
});

const router = Router();

// GET /api/v1/governorates
router.get('/', async (_req, res, next) => {
  try {
    const governorates = await prisma.governorate.findMany({
      orderBy: { shapeName: 'asc' },
      include: {
        _count: { select: { fruits: true } },
      },
    });

    const data = governorates.map((g) => ({
      shapeName:        g.shapeName,
      shapeISO:         g.shapeISO,
      aquiferStressPct: g.aquiferStressPct,
      waterLabel:       g.waterLabel,
      uvPeak:           g.uvPeak,
      uvLabel:          g.uvLabel,
      fruitCount:       g._count.fruits,
      description:      g.descriptionEn ?? undefined,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/governorates/:shapeName
router.get('/:shapeName', validate({ params: ShapeNameParamSchema }), async (req, res, next) => {
  try {
    const gov = await prisma.governorate.findUnique({
      where: { shapeName: req.params['shapeName'] },
      include: {
        _count: { select: { fruits: true } },
      },
    });

    if (!gov) return next(new HttpError(404, `Governorate '${req.params['shapeName']}' not found`));

    res.json({
      shapeName:        gov.shapeName,
      shapeISO:         gov.shapeISO,
      aquiferStressPct: gov.aquiferStressPct,
      waterLabel:       gov.waterLabel,
      uvPeak:           gov.uvPeak,
      uvLabel:          gov.uvLabel,
      fruitCount:       gov._count.fruits,
      description:      gov.descriptionEn ?? undefined,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
