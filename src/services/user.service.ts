import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types/models';

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
