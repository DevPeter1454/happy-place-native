import type { Timestamp } from 'firebase/firestore';

/**
 * Firestore document models for Happy Place.
 *
 * Collection layout (all user-scoped):
 *   users/{uid}                      -> UserProfile
 *   users/{uid}/activities/{id}      -> SpiritualActivity
 *   users/{uid}/journalEntries/{id}  -> JournalEntry
 *   users/{uid}/stats/summary        -> UserStats
 *
 * Timestamp fields are written with `serverTimestamp()` and read back as
 * Firestore `Timestamp`s.
 */

export interface UserPreferences {
  notifications: boolean;
  /** Daily prayer reminder time as "HH:MM" (24h), e.g. "20:00". */
  reminderTime?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  photoURL?: string;
  hasCompletedOnboarding: boolean;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** The three "checkable" disciplines logged as activity entries. */
export type ActivityType = 'prayer' | 'bible_reading' | 'confession';

export const ACTIVITY_TYPES: ActivityType[] = [
  'prayer',
  'bible_reading',
  'confession',
];

export interface SpiritualActivity {
  id: string;
  type: ActivityType;
  /** When the discipline was performed (defaults to now). */
  date: Timestamp;
  durationMinutes?: number;
  notes?: string;
  /** User-marked completion (e.g. a confession affirmation they've spoken). */
  completed?: boolean;
  createdAt: Timestamp;
}

/** Payload accepted by the service when creating an activity. */
export interface NewActivityInput {
  type: ActivityType;
  durationMinutes?: number;
  notes?: string;
  /** Optional JS Date; falls back to the server time. */
  date?: Date;
}

export interface JournalEntry {
  id: string;
  title?: string;
  body: string;
  mood?: string;
  isFavorite?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewJournalInput {
  title?: string;
  body: string;
  mood?: string;
}

/** A single verse within a fetched Bible passage. */
export interface BibleVerse {
  verse: number;
  text: string;
}

/**
 * The shared daily reading. Derived deterministically from the calendar date
 * (see services/bible.service) so every user sees the same passage on a day.
 */
export interface DailyReading {
  /** Local YYYY-MM-DD this reading is for. */
  dateKey: string;
  /** Human reference of the full passage, e.g. "Psalm 23". */
  reference: string;
  /** Translation name returned by the API, e.g. "World English Bible". */
  translationName: string;
  /** Every verse of the passage, for the reader. */
  verses: BibleVerse[];
  /** The short "verse of the day" featured on the home dashboard. */
  votd: { reference: string; text: string };
}

/** Highlight palette available in the Bible reader. */
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

/**
 * A user's annotation on a single verse (highlight color and/or bookmark).
 * Stored at users/{uid}/bibleVerses/{id}; identified by passage + verse so it
 * is translation-independent.
 */
export interface VerseAnnotation {
  /** Passage the verse belongs to, e.g. "Psalm 23". */
  reference: string;
  verse: number;
  /** Highlight color, or null/absent if not highlighted. */
  highlight?: HighlightColor | null;
  bookmarked?: boolean;
  /** Free-text note attached to the verse. */
  note?: string | null;
  updatedAt?: Timestamp;
}

export type RetreatKind = 'guided' | 'custom';

export type RetreatTaskKey = 'bible' | 'prayer' | 'journal' | 'confession';

/**
 * The user's active retreat, stored as a singleton at
 * users/{uid}/retreat/current. Task completion is tracked here explicitly and is
 * INDEPENDENT of the global streak/activities — logging a normal prayer or Bible
 * reading does not affect the retreat, and vice versa.
 */
export interface Retreat {
  kind: RetreatKind;
  /** Guided only: which curriculum from RETREAT_PLANS. */
  planId?: string;
  title: string;
  /** Inclusive start day as a YYYY-MM-DD key. */
  startDate: string;
  totalDays: number;
  /** Explicit per-day task completion, keyed by YYYY-MM-DD. */
  progress?: Record<string, Partial<Record<RetreatTaskKey, boolean>>>;
  /** Chosen Bible passage per day (YYYY-MM-DD → e.g. "John 3"). */
  scriptures?: Record<string, string>;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
}

/** Derived (not stored) completion for one day of a retreat. */
export interface RetreatDayProgress {
  dayIndex: number; // 1-based
  dateKey: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  tasks: {
    bible: boolean;
    prayer: boolean;
    confession: boolean;
    journal: boolean;
  };
}

/** Single summary document per user, updated as activities are logged. */
export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  /** ISO date string (YYYY-MM-DD) of the most recent activity day. */
  lastActivityDate: string | null;
  totalsByType: Record<ActivityType, number>;
  updatedAt: Timestamp;
}
