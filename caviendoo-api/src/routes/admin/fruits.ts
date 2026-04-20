import { Router } from 'express';
import { prisma } from '../../config/db';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { FruitCreateSchema, FruitUpdateSchema, IdParamSchema } from '../../schemas/adminSchemas';
import { mapFruitToResponse } from '../../utils/fruitMapper';
import { buildMeta, buildSkip } from '../../utils/paginate';
import { HttpError } from '../../utils/httpError';
import { z } from 'zod';

const ListQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const router = Router();
router.use(requireAuth);

// GET /api/v1/admin/fruits
router.get('/', validate({ query: ListQuerySchema }), async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;

    const [fruits, total] = await Promise.all([
      prisma.fruit.findMany({
        include: {
          environmental: true,
          images:        { where: { isPrimary: true }, take: 1 },
          _count:        { select: { governorates: true } },
        },
        orderBy: { nameEn: 'asc' },
        skip:    buildSkip(page, limit),
        take:    limit,
      }),
      prisma.fruit.count(),
    ]);

    res.json({
      data: fruits.map((f) => mapFruitToResponse(f)),
      meta: buildMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/fruits/:id
router.get('/:id', validate({ params: IdParamSchema }), async (req, res, next) => {
  try {
    const fruit = await prisma.fruit.findUnique({
      where: { id: req.params['id'] },
      include: {
        environmental: true,
        nutritional:   { orderBy: { sortOrder: 'asc' } },
        images:        true,
        governorates:  { include: { governorate: true } },
      },
    });

    if (!fruit) return next(new HttpError(404, 'Fruit not found'));
    res.json(mapFruitToResponse(fruit, { full: true }));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/fruits
router.post('/', validate({ body: FruitCreateSchema }), async (req, res, next) => {
  try {
    const { environmental, nutritional, governorateNames, ...fruitCore } = req.body;

    const fruit = await prisma.fruit.create({ data: fruitCore });

    if (environmental) {
      await prisma.fruitEnvironmental.create({
        data: { fruitId: fruit.id, ...environmental },
      });
    }

    if (nutritional?.length) {
      await prisma.nutritionalField.createMany({
        data: nutritional.map((n: any, i: number) => ({
          fruitId: fruit.id,
          ...n,
          sortOrder: i,
        })),
      });
    }

    if (governorateNames?.length) {
      await linkGovernorates(fruit.id, fruit.primaryGovernorate, governorateNames);
    }

    const created = await prisma.fruit.findUnique({
      where: { id: fruit.id },
      include: { environmental: true, nutritional: true, images: true, governorates: { include: { governorate: true } } },
    });

    res.status(201).json(mapFruitToResponse(created!, { full: true }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/fruits/:id
router.patch('/:id', validate({ params: IdParamSchema, body: FruitUpdateSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { environmental, nutritional, governorateNames, ...fruitCore } = req.body;

    const existing = await prisma.fruit.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return next(new HttpError(404, 'Fruit not found'));

    if (Object.keys(fruitCore).length) {
      await prisma.fruit.update({ where: { id }, data: fruitCore });
    }

    if (environmental) {
      await prisma.fruitEnvironmental.upsert({
        where:  { fruitId: id },
        update: environmental,
        create: { fruitId: id, ...environmental },
      });
    }

    if (nutritional) {
      await prisma.nutritionalField.deleteMany({ where: { fruitId: id } });
      await prisma.nutritionalField.createMany({
        data: nutritional.map((n: any, i: number) => ({ fruitId: id, ...n, sortOrder: i })),
      });
    }

    if (governorateNames) {
      await prisma.fruitGovernorate.deleteMany({ where: { fruitId: id } });
      const fruit = await prisma.fruit.findUnique({ where: { id }, select: { primaryGovernorate: true } });
      await linkGovernorates(id, fruit!.primaryGovernorate, governorateNames);
    }

    const updated = await prisma.fruit.findUnique({
      where: { id },
      include: { environmental: true, nutritional: true, images: true, governorates: { include: { governorate: true } } },
    });

    res.json(mapFruitToResponse(updated!, { full: true }));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/fruits/:id
router.delete('/:id', validate({ params: IdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const existing = await prisma.fruit.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return next(new HttpError(404, 'Fruit not found'));

    await prisma.fruit.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ── Helper ─────────────────────────────────────────────────────────────────

async function linkGovernorates(
  fruitId: string,
  primaryGovernorate: string,
  governorateNames: string[],
): Promise<void> {
  for (const name of governorateNames) {
    const gov = await prisma.governorate.findUnique({
      where:  { shapeName: name },
      select: { id: true },
    });
    if (!gov) continue;

    await prisma.fruitGovernorate.upsert({
      where:  { fruitId_governorateId: { fruitId, governorateId: gov.id } },
      update: { isPrimary: name === primaryGovernorate },
      create: { fruitId, governorateId: gov.id, isPrimary: name === primaryGovernorate },
    });
  }
}

export default router;
