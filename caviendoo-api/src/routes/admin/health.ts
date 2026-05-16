import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { redis } from '../../config/redis';
import { prisma } from '../../config/db';
import {
  uvForecastQueue,
  imageRefreshQueue,
  climateSyncQueue,
  nutritionSyncQueue,
} from '../../jobs/queues';

const router = Router();
router.use(requireAuth);

// GET /api/v1/admin/health
router.get('/', async (_req, res, next) => {
  try {
    const JOB_STATES = ['waiting', 'active', 'completed', 'failed', 'delayed'] as const;

    const [uv, imageRefresh, climate, nutrition, redisPing, dbPing] = await Promise.allSettled([
      uvForecastQueue.getJobCounts(...JOB_STATES),
      imageRefreshQueue.getJobCounts(...JOB_STATES),
      climateSyncQueue.getJobCounts(...JOB_STATES),
      nutritionSyncQueue.getJobCounts(...JOB_STATES),
      redis.ping(),
      prisma.$queryRaw`SELECT 1 AS ok`,
    ]);

    const toValue = (r: PromiseSettledResult<unknown>) =>
      r.status === 'fulfilled' ? r.value : { error: (r.reason as Error)?.message ?? 'unknown' };

    res.json({
      ts: new Date().toISOString(),
      redis: redisPing.status === 'fulfilled' ? 'ok' : 'error',
      db:    dbPing.status    === 'fulfilled' ? 'ok' : 'error',
      queues: {
        'uv-forecast':   toValue(uv),
        'image-refresh': toValue(imageRefresh),
        'climate-sync':  toValue(climate),
        'nutrition-sync': toValue(nutrition),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
