import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// getReactNativePersistence ships only in Firebase's React Native build. Metro
// resolves it at runtime, but the umbrella "firebase/auth" web typings omit it,
// so this single RN-only symbol is imported separately and type-suppressed.
// @ts-ignore -- present at runtime via @firebase/auth's react-native entry
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './config';

/**
 * Single shared Firebase app instance.
 *
 * `initializeApp` must only run once; on Fast Refresh the module can re-evaluate,
 * so we guard with `getApps()` and reuse the existing app when present.
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Auth must be initialized with React Native persistence (backed by
 * AsyncStorage) so the signed-in session survives app restarts. `initializeAuth`
 * can only be called once per app; if it has already run (Fast Refresh), fall
 * back to `getAuth`.
 */
function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
