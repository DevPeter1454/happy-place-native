import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { auth, db } from './firebase';
import type { UserPreferences, UserProfile } from '../types/models';

/** Firestore path helper for a user's profile document. */
export function userDocRef(uid: string) {
  return doc(db, 'users', uid);
}

/** Read a user's profile, or `null` if it has not been created yet. */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/**
 * Create the initial profile document for a freshly registered user.
 * Uses `merge: false` semantics via `setDoc` so the document is fully defined.
 */
export async function createProfile(params: {
  uid: string;
  email: string;
  fullName: string;
}): Promise<void> {
  await setDoc(userDocRef(params.uid), {
    uid: params.uid,
    email: params.email,
    fullName: params.fullName,
    hasCompletedOnboarding: false,
    preferences: { notifications: true },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Patch an existing profile; always bumps `updatedAt`. */
export async function updateProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, 'fullName' | 'photoURL' | 'preferences'>>
): Promise<void> {
  await setDoc(
    userDocRef(uid),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function setOnboardingComplete(uid: string): Promise<void> {
  await setDoc(
    userDocRef(uid),
    { hasCompletedOnboarding: true, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Delete the profile document (used when an account is removed). */
export async function deleteProfile(uid: string): Promise<void> {
  await deleteDoc(userDocRef(uid));
}

/**
 * Merge a partial preferences patch over the current preferences and persist it.
 *
 * Preferences live in a single nested map, so a plain `setDoc(merge: true)` with
 * `{ preferences: { x } }` would drop the sibling keys — callers pass what they
 * already have and get the merged result back.
 */
export async function updatePreferences(
  uid: string,
  current: UserPreferences | undefined,
  patch: Partial<UserPreferences>
): Promise<UserPreferences> {
  const next: UserPreferences = {
    notifications: true,
    ...current,
    ...patch,
  };
  await updateProfile(uid, { preferences: next });
  return next;
}

/**
 * Update the display name on the Firestore profile AND the Firebase auth
 * account, so screens reading either source agree.
 */
export async function setFullName(
  uid: string,
  fullName: string
): Promise<void> {
  const trimmed = fullName.trim();
  await updateProfile(uid, { fullName: trimmed });
  if (auth.currentUser?.uid === uid) {
    await updateAuthProfile(auth.currentUser, { displayName: trimmed });
  }
}

/**
 * Set the avatar URL on the profile document and the auth account. Passing
 * `null` clears it — the Firestore field is removed rather than written as null
 * so `photoURL?: string` stays honest.
 */
export async function setPhotoURL(
  uid: string,
  photoURL: string | null
): Promise<void> {
  await setDoc(
    userDocRef(uid),
    {
      photoURL: photoURL ?? deleteField(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  if (auth.currentUser?.uid === uid) {
    await updateAuthProfile(auth.currentUser, { photoURL });
  }
}
