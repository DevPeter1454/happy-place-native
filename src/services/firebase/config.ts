import Constants from 'expo-constants';
import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web-app configuration.
 *
 * The values are read from `expo.extra.firebase` in `app.json` so they live in
 * one place and can be swapped per environment without touching code. Replace
 * the placeholder values there with the web config from your Firebase project
 * (Project settings → Your apps → Web app). See ./README.md for setup steps.
 *
 * Note: Firebase web API keys are NOT secrets — they identify the project, and
 * access is controlled by Auth + Firestore/Storage security rules, not by
 * hiding the key. They are safe to ship in the client bundle.
 */
const extra = Constants.expoConfig?.extra as
  | { firebase?: FirebaseOptions }
  | undefined;

export const firebaseConfig: FirebaseOptions = {
  apiKey: extra?.firebase?.apiKey,
  authDomain: extra?.firebase?.authDomain,
  projectId: extra?.firebase?.projectId,
  storageBucket: extra?.firebase?.storageBucket,
  messagingSenderId: extra?.firebase?.messagingSenderId,
  appId: extra?.firebase?.appId,
  measurementId: extra?.firebase?.measurementId,
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith('YOUR_') &&
  !!firebaseConfig.projectId;
