const NodeCache = require('node-cache');

/**
 * In-memory cache service for the Finance module.
 * 
 * Uses node-cache (zero-setup, no Redis server needed for dev).
 * For production with multiple server instances, swap this to ioredis.
 * The API surface (get, set, invalidate, invalidateAll) stays the same.
 * 
 * Default TTL: 5 minutes (300 seconds)
 */
const cache = new NodeCache({
  stdTTL: 300,           // 5 min default TTL
  checkperiod: 60,       // Check for expired keys every 60s
  useClones: false,      // Return references (faster, we won't mutate)
});

/**
 * Get a cached value by key
 * @returns {any|null} The cached value, or null if not found
 */
const get = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    console.log(`[CACHE] HIT: ${key}`);
    return value;
  }
  console.log(`[CACHE] MISS: ${key}`);
  return null;
};

/**
 * Set a cached value with optional TTL override
 * @param {string} key 
 * @param {any} value 
 * @param {number} [ttlSeconds=300] TTL in seconds (default 5 min)
 */
const set = (key, value, ttlSeconds = 300) => {
  cache.set(key, value, ttlSeconds);
  console.log(`[CACHE] SET: ${key} (TTL: ${ttlSeconds}s)`);
};

/**
 * Invalidate a specific cache key
 */
const invalidate = (key) => {
  const deleted = cache.del(key);
  if (deleted > 0) {
    console.log(`[CACHE] INVALIDATED: ${key}`);
  }
};

/**
 * Invalidate all keys matching a pattern prefix
 * E.g., invalidatePattern('overview') clears 'overview', 'overview:...'
 */
const invalidatePattern = (prefix) => {
  const keys = cache.keys().filter(k => k.startsWith(prefix));
  if (keys.length > 0) {
    cache.del(keys);
    console.log(`[CACHE] INVALIDATED ${keys.length} keys matching "${prefix}*"`);
  }
};

/**
 * Flush entire cache — nuclear option
 */
const flush = () => {
  cache.flushAll();
  console.log('[CACHE] FLUSHED ALL');
};

/**
 * Get cache stats for debugging
 */
const stats = () => cache.getStats();

module.exports = { get, set, invalidate, invalidatePattern, flush, stats };
