import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';
import { cache } from '../middleware/cache';

const QuerySchema = z.object({
  country: z.string().min(2).max(2).default('TN'),
});

const router = Router();

// GET /api/v1/metrics?country=TN
router.get('/', cache(600), validate({ query: QuerySchema }), async (req, res, next) => {
  try {
    const { country } = req.query as any;
    const [totalFruits, totalGovernorates, totalAOC] = await Promise.all([
      prisma.fruit.count({ where: { published: true } }),
      prisma.governorate.count({ where: { countryCode: country } }),
      prisma.fruit.count({ where: { isAOC: true, published: true } }),
    ]);
    res.json({ totalFruits, totalGovernorates, totalAOC });
  } catch (err) {
    next(err);
  }
});

export default router;
