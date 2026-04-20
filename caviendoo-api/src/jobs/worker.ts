import '../config/env'; // validate env vars before anything else
import { uvForecastQueue } from './queues';
import { uvForecastWorker } from './uvForecastJob';
import { imageRefreshWorker } from './imageRefreshJob';
import { prisma } from '../config/db';

async function scheduleNightlyUvRun(): Promise<void> {
  // BullMQ repeatable job — fires at 02:00 UTC every day
  await uvForecastQueue.add(
    'nightly-all-govs',
    { trigger: 'cron' },
    {
      jobId:  'nightly-uv-all-govs',
      repeat: { pattern: '0 2 * * *', tz: 'UTC' },
    },
  );

  console.log('[worker] Nightly UV forecast cron registered — 02:00 UTC');
}

async function enqueueAllGovernorates(): Promise<void> {
  const govs = await prisma.governorate.findMany({
    where:  { centroidLat: { not: null }, centroidLng: { not: null } },
    select: { id: true, shapeName: true, centroidLat: true, centroidLng: true },
  });

  const jobs = govs.map((g) => ({
    name: 'uv-forecast-single',
    data: {
      governorateId: g.id,
      lat:           g.centroidLat!,
      lng:           g.centroidLng!,
      shapeName:     g.shapeName,
    },
    opts: { jobId: `uv-gov-${g.id}-${new Date().toISOString().slice(0, 10)}` },
  }));

  await uvForecastQueue.addBulk(jobs);
  console.log(`[worker] Enqueued UV jobs for ${govs.length} governorates`);
}

// Listen for the repeatable trigger job to fan out to individual jobs
uvForecastQueue.on('waiting', async (jobId: string) => {
  if (jobId === 'nightly-uv-all-govs') {
    await enqueueAllGovernorates().catch((err) =>
      console.error('[worker] Failed to enqueue UV jobs:', err),
    );
  }
});

async function main(): Promise<void> {
  console.log('[worker] Starting Caviendoo background worker…');

  await scheduleNightlyUvRun();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} received — shutting down…`);
    await Promise.all([
      uvForecastWorker.close(),
      imageRefreshWorker.close(),
      prisma.$disconnect(),
    ]);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  console.log('[worker] Ready');
}

main().catch((err) => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
