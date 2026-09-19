import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getCached, setCached } from "../services/cache";

export interface CachedData<T> {
  /** Cached value if this key has been loaded before, else undefined. */
  data: T | undefined;
  /** True only when there is nothing to show yet — drives a full-screen spinner. */
  loading: boolean;
  /** True while refreshing over data already on screen — for a subtle indicator. */
  refreshing: boolean;
  /** True only when a fetch failed with no cached data to fall back on. */
  error: boolean;
  refresh: () => Promise<void>;
  /**
   * Apply an optimistic local change, writing it to the cache as well so
   * navigating away and straight back doesn't resurrect the previous value.
   */
  mutate: (update: (prev: T | undefined) => T) => void;
}

/** Cheap structural comparison, to skip re-renders when nothing changed. */
function isSame(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Stale-while-revalidate data loading for a screen.
 *
 * On focus: if this key has been loaded before, its value renders immediately
 * and a refresh runs quietly behind it; the screen only re-renders if the new
 * data actually differs. A first visit shows `loading` as before.
 *
 * Pass `key: null` when there is nothing to load (e.g. no signed-in user) and
 * the hook stays idle.
 */
export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>
): CachedData<T> {
  const [data, setData] = useState<T | undefined>(() =>
    key ? getCached<T>(key) : undefined
  );
  const [loading, setLoading] = useState(
    () => !!key && getCached<T>(key) === undefined
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // The fetcher is typically defined inline and so changes identity on every
  // render; holding it in a ref keeps `revalidate` keyed only on `key`.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Switching key (sign-in, sign-out) adopts that key's cache synchronously, so
  // a warm key never flashes a spinner frame.
  useEffect(() => {
    const cached = key ? getCached<T>(key) : undefined;
    setData(cached);
    setLoading(!!key && cached === undefined);
    setError(false);
  }, [key]);

  const revalidate = useCallback(async () => {
    if (!key) return;
    if (getCached<T>(key) === undefined) setLoading(true);
    else setRefreshing(true);

    try {
      const fresh = await fetcherRef.current();
      setCached(key, fresh);
      if (!mounted.current) return;
      setError(false);
      setData((prev) => (isSame(prev, fresh) ? prev : fresh));
    } catch {
      if (!mounted.current) return;
      // A failed refresh over existing data stays silent — showing something
      // slightly stale beats blanking the screen.
      if (getCached<T>(key) === undefined) setError(true);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [key]);

  const mutate = useCallback(
    (update: (prev: T | undefined) => T) => {
      setData((prev) => {
        const next = update(prev);
        if (key) setCached(key, next);
        return next;
      });
    },
    [key]
  );

  useFocusEffect(
    useCallback(() => {
      revalidate();
    }, [revalidate])
  );

  return { data, loading, refreshing, error, refresh: revalidate, mutate };
}
