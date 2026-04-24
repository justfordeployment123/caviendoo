import { Router } from 'express';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';
import { FruitQuerySchema, FruitParamSchema } from '../schemas/fruitSchemas';
import { mapFruitToResponse } from '../utils/fruitMapper';
import { buildMeta, buildSkip } from '../utils/paginate';
import { HttpError } from '../utils/httpError';

const router = Router();

// GET /api/v1/fruits
router.get('/', validate({ query: FruitQuerySchema }), async (req, res, next) => {
  try {
    const { category, aocOnly, heritageOnly, governorate, page, limit } = req.query as any;

    const where = {
      ...(category     && { category }),
      ...(aocOnly      && { isAOC: true }),
      ...(heritageOnly && { isHeritage: true }),
      ...(governorate  && {
        governorates: {
          some: { governorate: { shapeName: governorate } },
        },
      }),
    };

    const [fruits, total] = await Promise.all([
      prisma.fruit.findMany({
        where,
        include: {
          environmental: { include: { region: { select: { shapeName: true } } } },
          images: {
            where:   { isPrimary: true, status: 'ready' },
            take:    1,
            orderBy: { createdAt: 'desc' },
          },
          governorates: {
            include: { governorate: { select: { shapeName: true } } },
          },
        },
        orderBy: { nameEn: 'asc' },
        skip:    buildSkip(page, limit),
        take:    limit,
      }),
      prisma.fruit.count({ where }),
    ]);

    res.json({
      data: fruits.map((f) => mapFruitToResponse(f)),
      meta: buildMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/fruits/:id
router.get('/:id', validate({ params: FruitParamSchema }), async (req, res, next) => {
  try {
    const fruit = await prisma.fruit.findUnique({
      where: { id: req.params['id'] },
      include: {
        environmental: { include: { region: { select: { shapeName: true } } } },
        nutritional:   { orderBy: { sortOrder: 'asc' } },
        images:        { where: { status: 'ready' }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] },
        governorates:  { include: { governorate: true } },
      },
    });

    if (!fruit) return next(new HttpError(404, `Fruit '${req.params['id']}' not found`));

    res.json(mapFruitToResponse(fruit, { full: true }));
  } catch (err) {
    next(err);
  }
});

export default router;
