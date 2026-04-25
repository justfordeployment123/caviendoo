import { Queue } from 'bullmq';
import { redis } from '../config/redis';

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 50 },
};

export const uvForecastQueue = new Queue('uv-forecast', {
  connection:          redis,
  defaultJobOptions:   DEFAULT_JOB_OPTIONS,
});

export const imageRefreshQueue = new Queue('image-refresh', {
  connection: redis,
  defaultJobOptions: {
    ...DEFAULT_JOB_OPTIONS,
    attempts: 2,
    backoff:  { type: 'fixed' as const, delay: 10_000 },
  },
});

export const climateSyncQueue = new Queue('climate-sync', {
  connection:        redis,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});
