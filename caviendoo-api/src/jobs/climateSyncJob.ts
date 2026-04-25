import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { getClimateClimatology } from '../services/nasaPowerService';
import { getSoilData } from '../services/isricService';

interface ClimateSyncJobData {
  governorateId: number;
  lat:           number;
  lng:           number;
  shapeName:     string;
}

export const climateSyncWorker = new Worker<ClimateSyncJobData>(
  'climate-sync',
  async (job: Job<ClimateSyncJobData>) => {
    const { governorateId, lat, lng } = job.data;

    const [climate, soil] = await Promise.all([
      getClimateClimatology(lat, lng),
      getSoilData(lat, lng),
    ]);

    await prisma.governorate.update({
      where: { id: governorateId },
      data:  {
        aquiferStressPct:     Math.round(climate.aquiferStressPct),
        // uvPeak is owned by the OpenUV nightly job — do not overwrite here.
        // NASA POWER ALLSKY_SFC_UV_INDEX is a daily average (includes night hours),
        // not the noon peak that the UV overlay needs.
        soilPhTypical:        soil.soilPhTypical,
        soilTexture:          soil.soilTexture,
        soilOrganicCarbonPct: soil.soilOrganicCarbonPct,
      },
    });

    return {
      governorateId,
      aquiferStressPct: climate.aquiferStressPct,
      soilPh: soil.soilPhTypical,
    };
  },
  {
    connection:  redis,
    concurrency: 3,
  },
);

climateSyncWorker.on('completed', (job) => {
  console.log(`[climateSync] ✓ job ${job.id} — gov #${job.data.governorateId} (${job.data.shapeName})`);
});

climateSyncWorker.on('failed', (job, err) => {
  console.error(`[climateSync] ✗ job ${job?.id} — gov #${job?.data.governorateId}: ${err.message}`);
});
