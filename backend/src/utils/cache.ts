import redis from './redis';

/**
 * High-performance Cache service for the Finance module using Redis.
 * Swapped from node-cache for production readiness.
 */

/**
 * Get a cached value by key
 */
export const get = async (key: string): Promise<any | null> => {
  if (redis.status !== 'ready') return null;
  try {
    const value = await redis.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (err) {
    console.error('Redis Get Cache Error:', err);
    return null;
  }
};

/**
 * Set a cached value with TTL
 */
export const set = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
  if (redis.status !== 'ready') return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Redis Set Cache Error:', err);
  }
};

/**
 * Invalidate a specific cache key
 */
export const invalidate = async (key: string): Promise<void> => {
  if (redis.status !== 'ready') return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Redis Invalidate Cache Error:', err);
  }
};

/**
 * Invalidate all keys matching a pattern prefix
 */
export const invalidatePattern = async (pattern: string): Promise<void> => {
  if (redis.status !== 'ready') return;
  try {
    const stream = redis.scanStream({
      match: `${pattern}*`,
      count: 100
    });

    stream.on('data', async (keys: string[]) => {
      if (keys.length > 0) {
        await redis.del(keys);
      }
    });
  } catch (err) {
    console.error('Redis InvalidatePattern Error:', err);
  }
};

/**
 * Flush entire cache
 */
export const flush = async (): Promise<void> => {
  if (redis.status !== 'ready') return;
  try {
    await redis.flushall();
    console.log('[REDIS CACHE] FLUSHED ALL');
  } catch (err) {
    console.error('Redis Flush Cache Error:', err);
  }
};

export default { get, set, invalidate, invalidatePattern, flush };
