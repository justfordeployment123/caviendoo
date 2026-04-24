import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';

const QuerySchema = z.object({
  country: z.string().min(2).max(2).default('TN'),
});

const router = Router();

// GET /api/v1/metrics?country=TN
router.get('/', validate({ query: QuerySchema }), async (req, res, next) => {
  try {
    const { country } = req.query as any;
    const [totalFruits, totalGovernorates, totalAOC] = await Promise.all([
      prisma.fruit.count(),
      prisma.governorate.count({ where: { countryCode: country } }),
      prisma.fruit.count({ where: { isAOC: true } }),
    ]);
    res.json({ totalFruits, totalGovernorates, totalAOC });
  } catch (err) {
    next(err);
  }
});

export default router;
