import { Router } from 'express';
import { prisma } from '../config/db';

const router = Router();

// GET /api/v1/metrics
router.get('/', async (_req, res, next) => {
  try {
    const [totalFruits, totalGovernorates, totalAOC] = await Promise.all([
      prisma.fruit.count(),
      prisma.governorate.count(),
      prisma.fruit.count({ where: { isAOC: true } }),
    ]);

    res.json({ totalFruits, totalGovernorates, totalAOC });
  } catch (err) {
    next(err);
  }
});

export default router;
