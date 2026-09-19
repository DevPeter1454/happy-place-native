import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  clearSessionStart,
  getSessionStart,
  MAX_SESSION_MS,
  setSessionStart,
} from "../services/prayerTimer";

export interface PrayerTimer {
  /** True once a restored session has been checked for — avoids a UI flicker. */
  ready: boolean;
  /** Epoch ms the running session began, or null when idle. */
  startedAt: number | null;
  /** Seconds elapsed in the running session. */
  elapsedSeconds: number;
  start: () => Promise<void>;
  /**
   * End the session and return its length in whole minutes (at least 1, so a
   * short-but-real prayer isn't recorded as nothing). Returns null if idle.
   */
  stop: () => Promise<number | null>;
  /** Abandon the session without recording anything. */
  discard: () => Promise<void>;
}

/** Wall-clock elapsed seconds since `startedAt`. */
function secondsSince(startedAt: number): number {
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

/**
 * A prayer stopwatch that keeps running while the app is backgrounded, closed,
 * or the phone is locked.
 *
 * Every reading is computed from the stored start timestamp rather than counted
 * up, so a suspended JS timer can't lose time; the interval below only exists to
 * repaint the display each second.
 */
export function usePrayerTimer(): PrayerTimer {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ready, setReady] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  startedAtRef.current = startedAt;

  // Restore any session left running by a previous visit or app launch.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await getSessionStart();
      if (!active) return;
      if (stored === null) {
        setReady(true);
        return;
      }
      // A session this old was forgotten, not prayed — drop it rather than
      // offering to log an implausible duration.
      if (Date.now() - stored > MAX_SESSION_MS) {
        await clearSessionStart();
        if (active) setReady(true);
        return;
      }
      setStartedAt(stored);
      setElapsedSeconds(secondsSince(stored));
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Repaint each second while running.
  useEffect(() => {
    if (startedAt === null) return;
    setElapsedSeconds(secondsSince(startedAt));
    const id = setInterval(() => setElapsedSeconds(secondsSince(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // Coming back to the foreground, re-read immediately rather than waiting for
  // the next tick — the interval may not have fired while suspended.
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      const current = startedAtRef.current;
      if (state === "active" && current !== null) {
        setElapsedSeconds(secondsSince(current));
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  const start = useCallback(async () => {
    if (startedAtRef.current !== null) return;
    const now = Date.now();
    setStartedAt(now);
    setElapsedSeconds(0);
    await setSessionStart(now);
  }, []);

  const stop = useCallback(async (): Promise<number | null> => {
    const current = startedAtRef.current;
    if (current === null) return null;
    const seconds = secondsSince(current);
    setStartedAt(null);
    setElapsedSeconds(0);
    await clearSessionStart();
    return Math.max(1, Math.round(seconds / 60));
  }, []);

  const discard = useCallback(async () => {
    setStartedAt(null);
    setElapsedSeconds(0);
    await clearSessionStart();
  }, []);

  return { ready, startedAt, elapsedSeconds, start, stop, discard };
}
