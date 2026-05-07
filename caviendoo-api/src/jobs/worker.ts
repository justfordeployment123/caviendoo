import '../config/env'; // validate env vars before anything else
import { uvForecastQueue, climateSyncQueue, nutritionSyncQueue } from './queues';
import { uvForecastWorker } from './uvForecastJob';
import { imageRefreshWorker } from './imageRefreshJob';
import { climateSyncWorker } from './climateSyncJob';
import { nutritionSyncWorker } from './nutritionSyncJob';
import { env } from '../config/env';
import { prisma } from '../config/db';

// ── Climate sync ──────────────────────────────────────────────────────────────

async function scheduleWeeklyClimateSync(): Promise<void> {
  await climateSyncQueue.add(
    'weekly-climate-all-govs',
    { trigger: 'cron' },
    {
      jobId:  'weekly-climate-all-govs',
      repeat: { pattern: '0 3 * * 0', tz: 'UTC' }, // Sunday 03:00 UTC
    },
  );
  console.log('[worker] Weekly climate sync cron registered — Sun 03:00 UTC');
}

async function enqueueAllGovernoratesClimate(): Promise<void> {
  const govs = await prisma.governorate.findMany({
    where:  { centroidLat: { not: null }, centroidLng: { not: null } },
    select: { id: true, shapeName: true, centroidLat: true, centroidLng: true },
  });

  const today = new Date().toISOString().slice(0, 10);
  const jobs = govs.map((g) => ({
    name: 'climate-sync-single',
    data: {
      governorateId: g.id,
      lat:           g.centroidLat!,
      lng:           g.centroidLng!,
      shapeName:     g.shapeName,
    },
    opts: { jobId: `climate-gov-${g.id}-${today}` },
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

// ── UV forecast ───────────────────────────────────────────────────────────────

async function scheduleNightlyUvRun(): Promise<void> {
  await uvForecastQueue.add(
    'nightly-all-govs',
    { trigger: 'cron' },
    {
      jobId:  'nightly-uv-all-govs',
      repeat: { pattern: '0 2 * * *', tz: 'UTC' }, // 02:00 UTC daily
    },
  );
  console.log('[worker] Nightly UV forecast cron registered — 02:00 UTC');
}

async function enqueueAllGovernorates(): Promise<void> {
  const govs = await prisma.governorate.findMany({
    where:  { centroidLat: { not: null }, centroidLng: { not: null } },
    select: { id: true, shapeName: true, centroidLat: true, centroidLng: true },
  });

  const today = new Date().toISOString().slice(0, 10);
  const jobs = govs.map((g) => ({
    name: 'uv-forecast-single',
    data: {
      governorateId: g.id,
      lat:           g.centroidLat!,
      lng:           g.centroidLng!,
      shapeName:     g.shapeName,
    },
    opts: { jobId: `uv-gov-${g.id}-${today}` },
  }));

  await uvForecastQueue.addBulk(jobs);
  console.log(`[worker] Enqueued UV jobs for ${govs.length} governorates`);
}

uvForecastQueue.on('waiting', (job: { id?: string | null }) => {
  if (job.id === 'nightly-uv-all-govs') {
    enqueueAllGovernorates().catch((err) =>
      console.error('[worker] Failed to enqueue UV jobs:', err),
    );
  }
});

// ── USDA Nutrition sync ───────────────────────────────────────────────────────

async function scheduleMonthlyNutritionSync(): Promise<void> {
  await nutritionSyncQueue.add(
    'monthly-nutrition-all-fruits',
    { trigger: 'cron' },
    {
      jobId:  'monthly-nutrition-all-fruits',
      repeat: { pattern: '0 4 1 * *', tz: 'UTC' }, // 1st of each month, 04:00 UTC
    },
  );
  console.log('[worker] Monthly nutrition sync cron registered — 1st of month 04:00 UTC');
}

async function enqueueAllFruitsNutrition(): Promise<void> {
  if (!env.USDA_API_KEY || env.USDA_API_KEY === 'CHANGE_ME') {
    console.log('[worker] USDA_API_KEY not set — skipping nutrition sync');
    return;
  }

  const fruits = await prisma.fruit.findMany({ select: { id: true, nameEn: true } });

  const today = new Date().toISOString().slice(0, 10);
  const jobs = fruits.map((f) => ({
    name: 'nutrition-sync-single',
    data: { fruitId: f.id, nameEn: f.nameEn },
    opts: { jobId: `nutrition-fruit-${f.id}-${today}` },
  }));

  await nutritionSyncQueue.addBulk(jobs);
  console.log(`[worker] Enqueued nutrition sync jobs for ${fruits.length} fruits`);
}

nutritionSyncQueue.on('waiting', (job: { id?: string | null }) => {
  if (job.id === 'monthly-nutrition-all-fruits') {
    enqueueAllFruitsNutrition().catch((err) =>
      console.error('[worker] Failed to enqueue nutrition jobs:', err),
    );
  }
});

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[worker] Starting Caviendoo background worker…');

  await scheduleNightlyUvRun();
  await scheduleWeeklyClimateSync();
  await scheduleMonthlyNutritionSync();

  // Immediate startup runs — use date-scoped jobIds so they're no-ops if
  // already ran today (BullMQ deduplicates by jobId).
  await enqueueAllGovernorates();
  await enqueueAllGovernoratesClimate();
  await enqueueAllFruitsNutrition();

  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} received — shutting down…`);
    await Promise.all([
      uvForecastWorker.close(),
      imageRefreshWorker.close(),
      climateSyncWorker.close(),
      nutritionSyncWorker.close(),
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
