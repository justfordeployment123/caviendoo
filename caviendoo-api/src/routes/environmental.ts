import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';
import { HttpError } from '../utils/httpError';

const ParamSchema = z.object({
  fruitId:  z.string().min(1),
  regionId: z.coerce.number().int().positive(),
});

const router = Router();

// GET /api/v1/environmental/:fruitId/:regionId
router.get('/:fruitId/:regionId', validate({ params: ParamSchema }), async (req, res, next) => {
  try {
    const fruitId  = req.params['fruitId'] as string;
    const regionId = Number(req.params['regionId']);

    const record = await prisma.fruitEnvironmental.findUnique({
      where:   { fruitId_regionId: { fruitId, regionId } },
      include: { region: { select: { shapeName: true, shapeISO: true } } },
    });

    if (!record) return next(new HttpError(404, 'Environmental record not found'));
    res.json(record);
  } catch (err) {
    next(err);
  }
});

export default router;
