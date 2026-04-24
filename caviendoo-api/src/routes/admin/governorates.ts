import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { GovernorateUpdateSchema, IntIdParamSchema } from '../../schemas/adminSchemas';
import { HttpError } from '../../utils/httpError';

const ListQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

const router = Router();
router.use(requireAuth);

// GET /api/v1/admin/governorates
router.get('/', validate({ query: ListQuerySchema }), async (_req, res, next) => {
  try {
    const governorates = await prisma.governorate.findMany({
      orderBy: { shapeName: 'asc' },
      include: { _count: { select: { fruits: true } } },
    });

    res.json({
      data: governorates.map((g) => ({
        id:               g.id,
        shapeName:        g.shapeName,
        shapeISO:         g.shapeISO,
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

// GET /api/v1/admin/governorates/:id
router.get('/:id', validate({ params: IntIdParamSchema }), async (req, res, next) => {
  try {
    const id  = Number(req.params['id']);
    const gov = await prisma.governorate.findUnique({ where: { id } });
    if (!gov) return next(new HttpError(404, 'Governorate not found'));
    res.json(gov);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/governorates/:id
router.patch(
  '/:id',
  validate({ params: IntIdParamSchema, body: GovernorateUpdateSchema }),
  async (req, res, next) => {
    try {
      const id = Number(req.params['id']);
      const existing = await prisma.governorate.findUnique({ where: { id }, select: { id: true } });
      if (!existing) return next(new HttpError(404, 'Governorate not found'));

      const updated = await prisma.governorate.update({
        where: { id },
        data:  req.body,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
