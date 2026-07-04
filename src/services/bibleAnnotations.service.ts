import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { HighlightColor, VerseAnnotation } from '../types/models';

/**
 * Per-verse highlight + bookmark annotations, scoped to the signed-in user at
 * users/{uid}/bibleVerses/{id}. A verse is keyed by passage + verse number so
 * annotations are translation-independent and upserts are idempotent. Writes
 * use a batch so multi-verse selections persist atomically.
 */

function versesCol(uid: string) {
  return collection(db, 'users', uid, 'bibleVerses');
}

/** Deterministic, slash-free doc id for a verse, e.g. "Psalm_23_1". */
function verseDocId(reference: string, verse: number): string {
  return `${reference.replace(/[^a-zA-Z0-9]+/g, '_')}_${verse}`;
}

/** Load all annotations for a passage, keyed by verse number. */
export async function listVerseAnnotations(
  uid: string,
  reference: string
): Promise<Map<number, VerseAnnotation>> {
  const snap = await getDocs(
    query(versesCol(uid), where('reference', '==', reference))
  );
  const map = new Map<number, VerseAnnotation>();
  snap.forEach((d) => {
    const data = d.data() as VerseAnnotation;
    map.set(data.verse, data);
  });
  return map;
}

/** All bookmarked verses for a user, newest reference grouping handled by caller. */
export async function listBookmarkedVerses(
  uid: string
): Promise<VerseAnnotation[]> {
  const snap = await getDocs(
    query(versesCol(uid), where('bookmarked', '==', true))
  );
  return snap.docs.map((d) => d.data() as VerseAnnotation);
}

/** Set (or clear, with null) the highlight color on one or more verses. */
export async function setVersesHighlight(
  uid: string,
  reference: string,
  verses: number[],
  color: HighlightColor | null
): Promise<void> {
  const batch = writeBatch(db);
  for (const verse of verses) {
    batch.set(
      doc(versesCol(uid), verseDocId(reference, verse)),
      { reference, verse, highlight: color, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
}

/** Set (or clear, with null) a free-text note on a single verse. */
export async function setVerseNote(
  uid: string,
  reference: string,
  verse: number,
  note: string | null
): Promise<void> {
  await setDoc(
    doc(versesCol(uid), verseDocId(reference, verse)),
    { reference, verse, note, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Set the bookmark flag on one or more verses. */
export async function setVersesBookmark(
  uid: string,
  reference: string,
  verses: number[],
  bookmarked: boolean
): Promise<void> {
  const batch = writeBatch(db);
  for (const verse of verses) {
    batch.set(
      doc(versesCol(uid), verseDocId(reference, verse)),
      { reference, verse, bookmarked, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
}
