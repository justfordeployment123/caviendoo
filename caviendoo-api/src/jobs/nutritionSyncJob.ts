import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { getNutritionByName } from '../services/usdaFoodService';

interface NutritionSyncJobData {
  fruitId: string;
  nameEn:  string;
}

export const nutritionSyncWorker = new Worker<NutritionSyncJobData>(
  'nutrition-sync',
  async (job: Job<NutritionSyncJobData>) => {
    const { fruitId, nameEn } = job.data;

    const fields = await getNutritionByName(nameEn);
    if (!fields || fields.length === 0) {
      console.warn(`[nutritionSync] No USDA data for "${nameEn}"`);
      return { fruitId, found: false };
    }

    await prisma.$transaction([
      prisma.nutritionalField.deleteMany({ where: { fruitId } }),
      prisma.nutritionalField.createMany({
        data: fields.map((f, i) => ({
          fruitId,
          labelEn:   f.label.en,
          labelFr:   f.label.fr,
          labelAr:   f.label.ar,
          value:     f.value,
          sortOrder: f.sortOrder ?? i,
        })),
      }),
    ]);

    return { fruitId, found: true, fieldsCount: fields.length };
  },
  {
    connection:  redis,
    concurrency: 2, // Low to respect USDA rate limits (3600 req/hr free tier)
  },
);

nutritionSyncWorker.on('completed', (job) => {
  const count = (job.returnvalue as any)?.fieldsCount ?? 0;
  const found = (job.returnvalue as any)?.found;
  if (found) {
    console.log(`[nutritionSync] ✓ ${job.data.nameEn} — ${count} nutrient fields`);
  }
});

nutritionSyncWorker.on('failed', (job, err) => {
  console.error(`[nutritionSync] ✗ ${job?.data.nameEn}: ${err.message}`);
});
