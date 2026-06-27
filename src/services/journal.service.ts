import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { JournalEntry, NewJournalInput } from '../types/models';

function journalCol(uid: string) {
  return collection(db, 'users', uid, 'journalEntries');
}

/** Create a journal entry; returns the new entry id. */
export async function addEntry(
  uid: string,
  input: NewJournalInput
): Promise<string> {
  const ref = await addDoc(journalCol(uid), {
    body: input.body,
    ...(input.title ? { title: input.title } : {}),
    ...(input.mood ? { mood: input.mood } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Patch an existing journal entry; always bumps `updatedAt`. */
export async function updateEntry(
  uid: string,
  entryId: string,
  patch: Partial<NewJournalInput>
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'journalEntries', entryId),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Toggle/set the favorite flag on a journal entry. */
export async function setFavorite(
  uid: string,
  entryId: string,
  isFavorite: boolean
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'journalEntries', entryId),
    { isFavorite },
    { merge: true }
  );
}

/** List a user's journal entries, newest first. */
export async function listEntries(uid: string): Promise<JournalEntry[]> {
  const snap = await getDocs(query(journalCol(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JournalEntry);
}

export async function deleteEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'journalEntries', entryId));
}
