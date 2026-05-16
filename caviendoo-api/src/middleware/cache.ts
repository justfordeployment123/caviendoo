import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

const KEY_PREFIX = 'cache:';

export function cache(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = `${KEY_PREFIX}${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch {
      // Cache read failed — serve fresh without caching
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      redis
        .setex(key, ttlSeconds, JSON.stringify(body))
        .catch(() => {/* Non-fatal — response already sent */});
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

export async function invalidateCache(urlPattern: string): Promise<void> {
  try {
    const stream = redis.scanStream({ match: `${KEY_PREFIX}${urlPattern}`, count: 100 });
    const keys: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (batch: string[]) => keys.push(...batch));
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    if (keys.length) await redis.del(...keys);
  } catch {
    // Cache invalidation is best-effort — stale entries expire via TTL
  }
}
