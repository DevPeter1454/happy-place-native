import AsyncStorage from '@react-native-async-storage/async-storage';
import { READING_PLAN } from '../constants/readingPlan';
import { DEFAULT_TRANSLATION, translationFor } from '../constants/bibleTranslations';
import type { BibleVerse, DailyReading } from '../types/models';

/**
 * Bible text + daily reading.
 *
 * Any chapter can be fetched from bible-api.com (free, no API key, public-domain
 * translations). The daily reading's passage is chosen deterministically from
 * the calendar date so every user sees the same passage on a day; readings are
 * cached in AsyncStorage per translation so they load instantly and offline.
 */

const API_BASE = 'https://bible-api.com';
const FETCH_TIMEOUT_MS = 12_000;
const TRANSLATION_KEY = 'bible-translation';

/** Local YYYY-MM-DD key for a date — mirrors the helper in activities.service. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 1-based day of the year (Jan 1 = 1), in local time. */
export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** The user's selected translation id (persisted), defaulting to KJV. */
export async function getStoredTranslation(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(TRANSLATION_KEY)) || DEFAULT_TRANSLATION;
  } catch {
    return DEFAULT_TRANSLATION;
  }
}

/** Persist the selected translation; clears the in-memory daily-reading memo. */
export async function setStoredTranslation(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TRANSLATION_KEY, id);
  } catch {
    // Best-effort; the caller still updates its in-memory state.
  }
  memo.clear();
}

/** Raw shape returned by bible-api.com for a passage request. */
interface BibleApiResponse {
  reference?: string;
  translation_name?: string;
  verses?: { verse: number; text: string }[];
}

export class BibleFetchError extends Error {}

/** Fetch all verses of a passage (a single chapter) in the given translation. */
export async function fetchChapter(
  reference: string,
  translation: string
): Promise<{ reference: string; verses: BibleVerse[]; translationName: string }> {
  const url = `${API_BASE}/${encodeURIComponent(reference)}?translation=${translation}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new BibleFetchError(`Request failed (${res.status})`);
    const data = (await res.json()) as BibleApiResponse;
    if (!data.verses || data.verses.length === 0) {
      throw new BibleFetchError('No verses returned');
    }
    return {
      reference,
      translationName: data.translation_name ?? translationFor(translation).name,
      verses: data.verses.map((v) => ({ verse: v.verse, text: v.text.trim() })),
    };
  } catch (err) {
    if (err instanceof BibleFetchError) throw err;
    throw new BibleFetchError('Could not load the passage');
  } finally {
    clearTimeout(timeout);
  }
}

/** The plan entry for a given day (deterministic, wraps by modulo). */
function planEntryFor(date: Date) {
  return READING_PLAN[dayOfYear(date) % READING_PLAN.length];
}

/** Today's deterministic reading reference (e.g. "Psalm 23"), without fetching. */
export function getDailyPassageRef(date: Date = new Date()): string {
  return planEntryFor(date).passage;
}

function cacheKeyFor(translation: string, key: string): string {
  return `bible-reading-${translation}-${key}`;
}

// In-memory memo so Home + Reader in one session don't both hit storage/network.
const memo = new Map<string, DailyReading>();

/**
 * The daily reading for `date` in the user's selected translation. Returns the
 * cached reading if available (memory, then AsyncStorage); otherwise fetches,
 * derives the verse of the day, caches, and returns it.
 */
export async function getDailyReading(
  date: Date = new Date()
): Promise<DailyReading> {
  const translation = await getStoredTranslation();
  const key = dateKey(date);
  const memoKey = `${translation}-${key}`;

  const memoized = memo.get(memoKey);
  if (memoized) return memoized;

  const cacheKey = cacheKeyFor(translation, key);
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as DailyReading;
      memo.set(memoKey, parsed);
      return parsed;
    }
  } catch {
    // Corrupt/unavailable cache — fall through to a fresh fetch.
  }

  const entry = planEntryFor(date);
  const passage = await fetchChapter(entry.passage, translation);

  const votdVerse =
    passage.verses.find((v) => v.verse === entry.votdVerse) ??
    passage.verses[0];

  const reading: DailyReading = {
    dateKey: key,
    reference: entry.passage,
    translationName: passage.translationName,
    verses: passage.verses,
    votd: {
      reference: `${entry.passage}:${votdVerse.verse}`,
      text: votdVerse.text,
    },
  };

  memo.set(memoKey, reading);
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(reading));
  } catch {
    // Best-effort cache; the in-memory memo still serves this session.
  }

  return reading;
}
