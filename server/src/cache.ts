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

