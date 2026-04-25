import { redis } from '../config/redis';

export const TTL = {
  WEATHER:      30 * 60,            // 30 min — current conditions change quickly
  CLIMATE:       7 * 24 * 60 * 60,  // 7 days — 30-yr climatology is stable
  NUTRITION:     7 * 24 * 60 * 60,  // 7 days — USDA data rarely changes
  BIODIVERSITY:  7 * 24 * 60 * 60,  // 7 days — GBIF counts change slowly
  PRODUCTION:   30 * 24 * 60 * 60,  // 30 days — FAOSTAT annual data
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('[cache] set failed:', (err as Error).message);
  }
}

export async function cacheGetOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  await cacheSet(key, data, ttlSeconds);
  return data;
}
