import Redis from 'ioredis';
import { env } from './env';

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    // Required by BullMQ — disables blocking mode checks
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 10) {
        console.error('Redis connection failed after 10 retries — aborting');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  client.on('error', (err) => console.error('[redis] error:', err.message));
  client.on('connect', () => console.log('[redis] connected'));
  client.on('reconnecting', () => console.warn('[redis] reconnecting…'));

  return client;
}

export const redis = createRedisClient();
