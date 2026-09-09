// In-memory cache for API responses (React Native equivalent of the web cache utility).
// Uses the same Stale-While-Revalidate (SWR) pattern as the web version.

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get data from cache or fetch it if missing/stale.
 * Implements Stale-While-Revalidate (SWR) pattern optionally.
 */
export const fetchWithCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300000,
  swr = true,
): Promise<T> => {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached) {
    const isStale = now - cached.timestamp > ttl;

    if (!isStale) {
      return cached.data;
    }

    if (swr) {
      fetcher()
        .then((data) => {
          cache.set(key, { data, timestamp: Date.now() });
        })
        .catch(() => {
          // Silent fail on background refresh
        });
      return cached.data;
    }
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

export const prefetch = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300000,
): void => {
  const now = Date.now();
  const cached = cache.get(key);

  if (!cached || now - cached.timestamp > ttl) {
    fetcher()
      .then((data) => {
        cache.set(key, { data, timestamp: Date.now() });
      })
      .catch(() => {});
  }
};

export const clearCache = (key?: string): void => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};
