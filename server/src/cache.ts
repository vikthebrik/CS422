/**
 * @file cache.ts
 * @description Simple in-memory TTL cache for API responses.
 *
 * Used by index.ts to cache GET /clubs, GET /events, and GET /event-types.
 * Cache is cleared after any mutation or after each ICS sync run.
 *
 * ## Env
 * `CACHE_TTL_SECONDS` — cache lifetime in seconds (default: 120)
 *
 * ## API
 * - `getFromCache(key)` — returns cached value or null if missing/expired
 * - `setInCache(key, value, ttlSeconds?)` — stores value with TTL
 * - `clearCacheKey(key)` — evicts a single key (called after targeted mutations)
 * - `clearAllCache()` — clears everything (called after sync or broad mutations)
 */
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL in seconds if none is provided on set()
const DEFAULT_TTL_SECONDS =
  Number(process.env.CACHE_TTL_SECONDS) > 0
    ? Number(process.env.CACHE_TTL_SECONDS)
    : 120;

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    // Expired - clean up and treat as miss
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setInCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value, expiresAt });
}

export function clearCacheKey(key: string): void {
  cache.delete(key);
}

export function clearAllCache(): void {
  cache.clear();
}

export function getCacheStatus(): Array<{ key: string; expiresAt: number; ttlMs: number }> {
  const now = Date.now();
  const result = [];
  for (const [key, entry] of cache.entries()) {
    if (now <= entry.expiresAt) {
      result.push({ key, expiresAt: entry.expiresAt, ttlMs: entry.expiresAt - now });
    }
  }
  return result;
}

