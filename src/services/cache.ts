/**
 * A tiny in-memory cache for query results, keyed by a caller-chosen string.
 *
 * This backs the stale-while-revalidate behaviour in `useCachedData`: a screen
 * that has been visited renders its previous data immediately instead of showing
 * a spinner, while a fresh read happens in the background.
 *
 * Deliberately memory-only — it lives for the app session and is gone on quit.
 * Persisting to AsyncStorage would mean serializing Firestore `Timestamp`s,
 * which don't survive a JSON round-trip (they'd come back as plain
 * `{ seconds, nanoseconds }` objects and break every `.toDate()` call site).
 *
 * Keys must include the uid of the user they belong to, and the whole store is
 * cleared on sign-out, so one account can never read another's cached data.
 */

const store = new Map<string, unknown>();

export function getCached<T>(key: string): T | undefined {
  return store.has(key) ? (store.get(key) as T) : undefined;
}

export function setCached<T>(key: string, value: T): void {
  store.set(key, value);
}

/** Drop cached entries — everything, or just those under a key prefix. */
export function invalidateCache(prefix?: string): void {
  if (prefix === undefined) {
    store.clear();
    return;
  }
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Cache keys, gathered here so prefixes stay consistent for invalidation. */
export const cacheKeys = {
  dashboard: (uid: string) => `dashboard:${uid}`,
  journal: (uid: string) => `journal:${uid}`,
  confessions: (uid: string) => `confessions:${uid}`,
  prayers: (uid: string) => `prayers:${uid}`,
  prayerTracker: (uid: string) => `tracker:prayer:${uid}`,
  bibleTracker: (uid: string) => `tracker:bible:${uid}`,
  confessionTracker: (uid: string) => `tracker:confession:${uid}`,
  journalTracker: (uid: string) => `tracker:journal:${uid}`,
} as const;
