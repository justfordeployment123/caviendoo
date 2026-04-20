import { Router } from 'express';
import { prisma } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { env } from '../config/env';
import { fetchUvForecast } from '../services/openuvService';

const router = Router();

// POST /api/v1/env-data/refresh  — triggers a UV forecast refresh for all governorates (admin only)
router.post('/refresh', requireAuth, async (_req, res, next) => {
  try {
    const governorates = await prisma.governorate.findMany({
      where: {
        centroidLat: { not: null },
        centroidLng: { not: null },
      },
      select: { id: true, shapeName: true, centroidLat: true, centroidLng: true },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const results = await Promise.allSettled(
      governorates.map(async (gov) => {
        const forecast = await fetchUvForecast(gov.centroidLat!, gov.centroidLng!);
        const isAlert  = forecast.uv_max >= env.UV_ALERT_THRESHOLD;

        await prisma.uvForecast.upsert({
          where:  { governorateId_forecastDate: { governorateId: gov.id, forecastDate: today } },
          update: { uvMax: forecast.uv_max, uvAlert: isAlert, rawPayload: forecast as object },
          create: {
            governorateId: gov.id,
            forecastDate:  today,
            uvMax:         forecast.uv_max,
            uvAlert:       isAlert,
            rawPayload:    forecast as object,
          },
        });

        return { governorate: gov.shapeName, uvMax: forecast.uv_max, alert: isAlert };
      }),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed    = results.filter((r) => r.status === 'rejected');

    res.json({
      refreshed: succeeded.length,
      failed:    failed.length,
      total:     governorates.length,
      results:   succeeded.map((r) => (r as PromiseFulfilledResult<any>).value),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
