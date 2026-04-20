import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { fetchAndStoreImageForFruit } from '../services/imageService';

interface ImageJobData {
  fruitId:     string;
  fruitNameEn: string;
  latinName:   string;
}

export const imageRefreshWorker = new Worker<ImageJobData>(
  'image-refresh',
  async (job: Job<ImageJobData>) => {
    const { fruitId, fruitNameEn, latinName } = job.data;

    // Skip if fruit already has a ready image
    const existing = await prisma.fruitImage.findFirst({
      where: { fruitId, status: 'ready' },
      select: { id: true },
    });

    if (existing) {
      console.log(`[imageRefresh] ${fruitId} already has a ready image — skipping`);
      return { skipped: true };
    }

    await fetchAndStoreImageForFruit(fruitId, fruitNameEn, latinName);
    return { processed: true };
  },
  {
    connection:  redis,
    concurrency: 3, // max 3 concurrent image downloads
  },
);

imageRefreshWorker.on('failed', (job, err) => {
  console.error(`[imageRefresh] ✗ job ${job?.id} — fruit ${job?.data.fruitId}: ${err.message}`);
});
