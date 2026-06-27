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

/** Single summary document per user, updated as activities are logged. */
export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  /** ISO date string (YYYY-MM-DD) of the most recent activity day. */
  lastActivityDate: string | null;
  totalsByType: Record<ActivityType, number>;
  updatedAt: Timestamp;
}
