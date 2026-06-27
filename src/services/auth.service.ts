import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { createProfile } from './user.service';
import type { ActivityType } from '../types/models';

const INITIAL_TOTALS: Record<ActivityType, number> = {
  prayer: 0,
  bible_reading: 0,
  confession: 0,
};

/**
 * Register a new user: create the auth account, set the display name, then
 * create the Firestore profile and an initial stats document.
 */
export async function signUp(
  fullName: string,
  email: string,
  password: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const trimmedName = fullName.trim();

  await updateAuthProfile(cred.user, { displayName: trimmedName });

  // Provision the Firestore profile + stats docs. This is best-effort: the user
  // is already authenticated, so a transient Firestore error here must not strand
  // them on the signup screen — they should still land in the app. Missing docs
  // are recreated lazily on next load.
  try {
    await createProfile({
      uid: cred.user.uid,
      email: cred.user.email ?? email.trim(),
      fullName: trimmedName,
    });

    // Seed the stats summary document so the streak logic always has a base doc.
    await setDoc(doc(db, 'users', cred.user.uid, 'stats', 'summary'), {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      totalsByType: INITIAL_TOTALS,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[signUp] Firestore provisioning failed:', e);
  }

  return cred.user;
}

export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOutUser(): Promise<void> {
  return signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email.trim());
}

/**
 * Translate a Firebase auth error code into a short, user-facing message.
 * Accepts the raw error so callers can `catch (e) { setError(mapAuthError(e)) }`.
 */
export function mapAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
