import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { dateKey } from './bible.service';
import type {
  Retreat,
  RetreatDayProgress,
  RetreatKind,
  RetreatTaskKey,
} from '../types/models';

/**
 * The active retreat is a singleton doc at users/{uid}/retreat/current. Task
 * completion is stored on the retreat itself (`progress` map keyed by day), kept
 * deliberately SEPARATE from the global streak/activities so the two never
 * interfere — a normal prayer/Bible reading does not tick a retreat task.
 */

function retreatRef(uid: string) {
  return doc(db, 'users', uid, 'retreat', 'current');
}

/** Add `days` calendar days to a YYYY-MM-DD key, returning a new key. */
function addDaysKey(startKey: string, days: number): string {
  const d = new Date(`${startKey}T00:00:00`);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export interface StartRetreatInput {
  kind: RetreatKind;
  planId?: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  totalDays: number;
}

export async function startRetreat(
  uid: string,
  input: StartRetreatInput
): Promise<void> {
  await setDoc(retreatRef(uid), {
    kind: input.kind,
    ...(input.planId ? { planId: input.planId } : {}),
    title: input.title,
    startDate: input.startDate,
    totalDays: input.totalDays,
    progress: {},
    createdAt: serverTimestamp(),
    completedAt: null,
  });
}

export async function getRetreat(uid: string): Promise<Retreat | null> {
  const snap = await getDoc(retreatRef(uid));
  return snap.exists() ? (snap.data() as Retreat) : null;
}

/** Set completion of a single retreat task on a given day (retreat-local). */
export async function setRetreatTask(
  uid: string,
  dayKey: string,
  task: RetreatTaskKey,
  done: boolean
): Promise<void> {
  // Deep-merges so other days/tasks in the progress map are preserved.
  await setDoc(
    retreatRef(uid),
    { progress: { [dayKey]: { [task]: done } } },
    { merge: true }
  );
}

/** Choose the Bible passage for a given retreat day. */
export async function setRetreatScripture(
  uid: string,
  dayKey: string,
  reference: string
): Promise<void> {
  await setDoc(
    retreatRef(uid),
    { scriptures: { [dayKey]: reference } },
    { merge: true }
  );
}

/** Mark the retreat complete (kept so setup can offer a fresh start). */
export async function completeRetreat(uid: string): Promise<void> {
  await setDoc(
    retreatRef(uid),
    { completedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Remove the active retreat entirely so a new one can be started. */
export async function clearRetreat(uid: string): Promise<void> {
  await deleteDoc(retreatRef(uid));
}

/**
 * Expand a retreat into its per-day progress, reading completion straight from
 * the retreat's own `progress` map (pure — no activity/streak data involved).
 */
export function computeRetreatDays(retreat: Retreat): RetreatDayProgress[] {
  const todayKey = dateKey(new Date());
  const days: RetreatDayProgress[] = [];
  for (let i = 0; i < retreat.totalDays; i++) {
    const key = addDaysKey(retreat.startDate, i);
    const p = retreat.progress?.[key] ?? {};
    days.push({
      dayIndex: i + 1,
      dateKey: key,
      isToday: key === todayKey,
      isPast: key < todayKey,
      isFuture: key > todayKey,
      tasks: {
        bible: !!p.bible,
        prayer: !!p.prayer,
        confession: !!p.confession,
        journal: !!p.journal,
      },
    });
  }
  return days;
}
