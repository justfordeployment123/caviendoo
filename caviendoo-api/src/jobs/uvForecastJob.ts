import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { fetchUvForecast } from '../services/openuvService';
import { env } from '../config/env';

interface UvJobData {
  governorateId: number;
  lat:           number;
  lng:           number;
  shapeName:     string;
}

export const uvForecastWorker = new Worker<UvJobData>(
  'uv-forecast',
  async (job: Job<UvJobData>) => {
    const { governorateId, lat, lng } = job.data;

    const forecast = await fetchUvForecast(lat, lng);
    const isAlert  = forecast.uv_max >= env.UV_ALERT_THRESHOLD;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await prisma.$transaction([
      prisma.uvForecast.upsert({
        where:  { governorateId_forecastDate: { governorateId, forecastDate: today } },
        update: { uvMax: forecast.uv_max, uvAlert: isAlert, rawPayload: forecast as object },
        create: {
          governorateId,
          forecastDate: today,
          uvMax:        forecast.uv_max,
          uvAlert:      isAlert,
          rawPayload:   forecast as object,
        },
      }),
      // Keep uvPeak on the governorate row fresh for map overlay
      prisma.governorate.update({
        where:  { id: governorateId },
        data:   { uvPeak: forecast.uv_max },
      }),
    ]);

    if (isAlert) {
      console.warn(
        `[UV ALERT] ${job.data.shapeName}: UV max=${forecast.uv_max} ` +
        `(threshold=${env.UV_ALERT_THRESHOLD})`,
      );
      // TODO Phase 9: send email/webhook alert via alertService
    }

    return { governorateId, uvMax: forecast.uv_max, alert: isAlert };
  },
  {
    connection:  redis,
    concurrency: 5, // max 5 OpenUV calls in parallel
  },
);

uvForecastWorker.on('completed', (job) => {
  console.log(`[uvForecast] ✓ job ${job.id} — gov #${job.data.governorateId}`);
});

uvForecastWorker.on('failed', (job, err) => {
  console.error(`[uvForecast] ✗ job ${job?.id} — gov #${job?.data.governorateId}: ${err.message}`);
});
