import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile as updateAuthProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { createProfile, deleteProfile } from './user.service';
import { deleteAvatar } from './storage.service';
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
 * Whether the account can change its password in-app. Accounts created through
 * a federated provider (Google, Apple, …) have no password to rotate.
 */
export function hasPasswordProvider(user: User | null): boolean {
  return !!user?.providerData.some((p) => p.providerId === 'password');
}

/**
 * Change the signed-in user's password.
 *
 * Firebase requires a recent login for this, so the current password is used to
 * re-authenticate first — which also means a wrong current password fails here
 * rather than silently succeeding.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const current = auth.currentUser;
  if (!current?.email) {
    throw new Error('No signed-in account with a password to change.');
  }
  await reauthenticateWithCredential(
    current,
    EmailAuthProvider.credential(current.email, currentPassword)
  );
  await updatePassword(current, newPassword);
}

/**
 * Permanently delete the signed-in account, then its avatar and profile
 * document. Deleting the auth user flips onAuthStateChanged, which returns the
 * app to the auth flow on its own.
 *
 * The cleanup runs only when we were able to re-authenticate first: without a
 * fresh credential Firebase can reject the deletion with
 * `auth/requires-recent-login`, and wiping the profile ahead of a rejected
 * deletion would destroy a live account's data.
 *
 * Note: nested subcollections (activities, journalEntries, …) cannot be deleted
 * from the client in one call, so they are left behind either way. Reap them
 * with a Cloud Function or the "Delete User Data" Firebase extension.
 */
export async function deleteAccount(currentPassword?: string): Promise<void> {
  const current = auth.currentUser;
  const email = current?.email;
  if (!current) throw new Error('No signed-in account to delete.');

  const reauthenticated = Boolean(currentPassword && email);
  if (currentPassword && email) {
    await reauthenticateWithCredential(
      current,
      EmailAuthProvider.credential(email, currentPassword)
    );
  }

  if (reauthenticated) {
    // Best-effort — a failure here must not block the deletion itself.
    await Promise.allSettled([deleteAvatar(current.uid), deleteProfile(current.uid)]);
  }
  await deleteUser(current);
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
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/requires-recent-login':
      return 'For your security, sign in again before making this change.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
