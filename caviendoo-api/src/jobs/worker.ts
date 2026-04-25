import '../config/env'; // validate env vars before anything else
import { uvForecastQueue, climateSyncQueue } from './queues';
import { uvForecastWorker } from './uvForecastJob';
import { imageRefreshWorker } from './imageRefreshJob';
import { climateSyncWorker } from './climateSyncJob';
import { prisma } from '../config/db';

async function scheduleWeeklyClimateSync(): Promise<void> {
  // Fires every Sunday at 03:00 UTC — NASA POWER 30-yr climatology rarely changes
  await climateSyncQueue.add(
    'weekly-climate-all-govs',
    { trigger: 'cron' },
    {
      jobId:  'weekly-climate-all-govs',
      repeat: { pattern: '0 3 * * 0', tz: 'UTC' },
    },
  );
  console.log('[worker] Weekly climate sync cron registered — Sun 03:00 UTC');
}

async function enqueueAllGovernoratesClimate(): Promise<void> {
  const govs = await prisma.governorate.findMany({
    where:  { centroidLat: { not: null }, centroidLng: { not: null } },
    select: { id: true, shapeName: true, centroidLat: true, centroidLng: true },
  });

  const jobs = govs.map((g) => ({
    name: 'climate-sync-single',
    data: {
      governorateId: g.id,
      lat:           g.centroidLat!,
      lng:           g.centroidLng!,
      shapeName:     g.shapeName,
    },
    opts: { jobId: `climate-gov-${g.id}-${new Date().toISOString().slice(0, 10)}` },
  }));

  await climateSyncQueue.addBulk(jobs);
  console.log(`[worker] Enqueued climate sync jobs for ${govs.length} governorates`);
}

climateSyncQueue.on('waiting', (job: { id?: string | null }) => {
  if (job.id === 'weekly-climate-all-govs') {
    enqueueAllGovernoratesClimate().catch((err) =>
      console.error('[worker] Failed to enqueue climate jobs:', err),
    );
  }
});

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
uvForecastQueue.on('waiting', (job: { id?: string | null }) => {
  if (job.id === 'nightly-uv-all-govs') {
    enqueueAllGovernorates().catch((err) =>
      console.error('[worker] Failed to enqueue UV jobs:', err),
    );
  }
});

async function main(): Promise<void> {
  console.log('[worker] Starting Caviendoo background worker…');

  await scheduleNightlyUvRun();
  await scheduleWeeklyClimateSync();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} received — shutting down…`);
    await Promise.all([
      uvForecastWorker.close(),
      imageRefreshWorker.close(),
      climateSyncWorker.close(),
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
