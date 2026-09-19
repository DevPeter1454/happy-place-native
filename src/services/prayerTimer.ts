import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistence for an in-progress prayer session.
 *
 * Only the *start timestamp* is stored, never an accumulated count: elapsed time
 * is always derived from the wall clock. People lock their phone while praying,
 * which suspends JS timers — deriving from a timestamp means a 20-minute prayer
 * with the screen off is still 20 minutes, and a session survives the app being
 * killed entirely.
 */

const STARTED_AT_KEY = 'prayer-timer-started-at';

/**
 * Sessions longer than this are treated as forgotten rather than real, and are
 * dropped on restore instead of logging an implausible duration.
 */
export const MAX_SESSION_MS = 6 * 60 * 60 * 1000;

/** Epoch ms a session began, or null if none is running. */
export async function getSessionStart(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STARTED_AT_KEY);
    if (!raw) return null;
    const startedAt = parseInt(raw, 10);
    return Number.isFinite(startedAt) ? startedAt : null;
  } catch {
    return null;
  }
}

export async function setSessionStart(startedAt: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STARTED_AT_KEY, String(startedAt));
  } catch {
    // Best-effort: the in-memory session still runs for this app session.
  }
}

export async function clearSessionStart(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STARTED_AT_KEY);
  } catch {
    // Ignore — the caller has already cleared its own state.
  }
}
