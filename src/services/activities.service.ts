import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  ActivityType,
  NewActivityInput,
  SpiritualActivity,
  UserStats,
} from '../types/models';

function activitiesCol(uid: string) {
  return collection(db, 'users', uid, 'activities');
}

function statsRef(uid: string) {
  return doc(db, 'users', uid, 'stats', 'summary');
}

/** Local YYYY-MM-DD key for a date, used for streak day comparisons. */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Difference in whole calendar days between two YYYY-MM-DD keys. */
function dayDiff(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

const EMPTY_TOTALS: Record<ActivityType, number> = {
  prayer: 0,
  bible_reading: 0,
  confession: 0,
};

/**
 * Log a spiritual activity and atomically update the user's streak stats.
 *
 * The new activity document and the stats summary are written in a single
 * transaction so the streak/totals never drift from the underlying activities.
 * Returns the new activity's id.
 */
export async function addActivity(
  uid: string,
  input: NewActivityInput
): Promise<string> {
  const when = input.date ?? new Date();
  const todayKey = dateKey(when);

  // Create the activity document first (addDoc generates the id).
  const activityRef = await addDoc(activitiesCol(uid), {
    type: input.type,
    date: Timestamp.fromDate(when),
    ...(input.durationMinutes != null
      ? { durationMinutes: input.durationMinutes }
      : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    createdAt: serverTimestamp(),
  });

  // Then fold the streak/totals update into a transaction on the stats doc.
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(statsRef(uid));
    const prev = (snap.data() as UserStats | undefined) ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      totalsByType: { ...EMPTY_TOTALS },
    };

    let currentStreak = prev.currentStreak;
    if (!prev.lastActivityDate) {
      currentStreak = 1;
    } else {
      const diff = dayDiff(prev.lastActivityDate, todayKey);
      if (diff === 0) {
        // Same day — streak unchanged, but never less than 1.
        currentStreak = Math.max(currentStreak, 1);
      } else if (diff === 1) {
        currentStreak = currentStreak + 1;
      } else if (diff > 1) {
        currentStreak = 1;
      }
      // diff < 0 (back-dated entry) leaves the streak as-is.
    }

    const totals = { ...EMPTY_TOTALS, ...prev.totalsByType };
    totals[input.type] = (totals[input.type] ?? 0) + 1;

    tx.set(statsRef(uid), {
      currentStreak,
      longestStreak: Math.max(prev.longestStreak, currentStreak),
      lastActivityDate:
        !prev.lastActivityDate || todayKey >= prev.lastActivityDate
          ? todayKey
          : prev.lastActivityDate,
      totalsByType: totals,
      updatedAt: serverTimestamp(),
    });
  });

  return activityRef.id;
}

/** Read a user's aggregate stats summary, or null if none has been written. */
export async function getStats(uid: string): Promise<UserStats | null> {
  const snap = await getDoc(statsRef(uid));
  return snap.exists() ? (snap.data() as UserStats) : null;
}

/** List a user's activities (newest first), optionally filtered by type. */
export async function listActivities(
  uid: string,
  type?: ActivityType
): Promise<SpiritualActivity[]> {
  const base = activitiesCol(uid);
  // A typed query uses only an equality filter (no orderBy) so it doesn't
  // require a composite index; we sort by date client-side instead.
  const q = type
    ? query(base, where('type', '==', type))
    : query(base, orderBy('date', 'desc'));

  const snap = await getDocs(q);
  const items = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as SpiritualActivity
  );

  return type
    ? items.sort((a, b) => b.date.toMillis() - a.date.toMillis())
    : items;
}

export async function deleteActivity(
  uid: string,
  activityId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'activities', activityId));
}
