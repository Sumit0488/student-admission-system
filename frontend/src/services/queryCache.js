/**
 * Module-level in-memory cache for API responses.
 * Lives for the browser session — survives React route changes (module singleton).
 * TTL: 3 minutes. Invalidated on mutations.
 */
const CACHE = new Map();
const TTL_MS = 3 * 60 * 1000;

const qc = {
  /** Return cached data if still fresh, otherwise null. */
  get(key) {
    const entry = CACHE.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL_MS) {
      CACHE.delete(key);
      return null;
    }
    return entry.data;
  },

  /** Store data with current timestamp. */
  set(key, data) {
    CACHE.set(key, { data, ts: Date.now() });
  },

  /** True if key has a fresh (non-expired) entry. */
  has(key) {
    return this.get(key) !== null;
  },

  /** Remove one or more keys (call after mutations). */
  del(...keys) {
    keys.forEach((k) => CACHE.delete(k));
  },
};

export default qc;
