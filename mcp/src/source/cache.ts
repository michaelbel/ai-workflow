interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface BoundedTtlCacheOptions {
  ttlMs: number;
  maxEntries: number;
}

/**
 * A small bounded TTL cache used by the optional GitHub source.
 *
 * - `maxEntries` bounds memory: once exceeded, the oldest inserted entry is evicted (a bounded
 *   Map, not an unbounded one).
 * - `getStale` returns the last known value for a key even after it has expired, so callers can
 *   fall back to it when a live GitHub fetch fails (network down, rate limited, etc).
 */
export class BoundedTtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly options: BoundedTtlCacheOptions) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt < Date.now()) {
      return undefined;
    }
    return entry.value;
  }

  getStale(key: string): T | undefined {
    return this.entries.get(key)?.value;
  }

  set(key: string, value: T): void {
    if (!this.entries.has(key) && this.entries.size >= this.options.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
    // Re-inserting moves the key to the end of Map's iteration order, keeping "oldest first"
    // eviction meaningful for entries that get refreshed often.
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.options.ttlMs });
  }

  get size(): number {
    return this.entries.size;
  }
}

/**
 * De-duplicates concurrent calls for the same key: if a call for `key` is already in flight, the
 * caller gets the same in-flight promise instead of starting a second network request.
 */
export class RequestDeduplicator<T> {
  private readonly inFlight = new Map<string, Promise<T>>();

  async run(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }
}
