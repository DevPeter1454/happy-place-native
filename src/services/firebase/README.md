# Firebase setup — Happy Place

This app uses the **Firebase JS SDK** (the `firebase` npm package), not React
Native Firebase. This is deliberate: the JS SDK is pure JavaScript and requires
**no `expo prebuild` and no changes to the `ios/` or `android/` folders**, which
protects the project's manual iOS 26 native patches.

## One-time console setup

1. Go to https://console.firebase.google.com and **create a new project**.
2. In the project, **Build → Authentication → Get started** and enable the
   **Email/Password** sign-in provider.
3. **Build → Firestore Database → Create database** (Production mode).
4. **Build → Storage → Get started** (used later for profile images / media).
5. **Project settings (gear icon) → Your apps → Add app → Web (`</>`)**.
   Register the app and copy the `firebaseConfig` object it shows.

> The JS SDK uses the **Web** config even on iOS/Android. You do **not** need
> `google-services.json` or `GoogleService-Info.plist`.

## Wire the config into the app

Secrets are kept **out of git**. The Firebase web config is read from a
gitignored `.env` file, injected into Expo's `extra` by
[`app.config.js`](../../../app.config.js), and read at runtime by `config.ts`
via `expo-constants`.

1. Copy the template: `cp .env.example .env`
2. Fill `.env` with the values from your web config:

```sh
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=happy-place-xxxx.firebaseapp.com
FIREBASE_PROJECT_ID=happy-place-xxxx
FIREBASE_STORAGE_BUCKET=happy-place-xxxx.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

3. Restart the dev server so the new env values are picked up: `expo start -c`

> `.env` is gitignored; only the placeholder `.env.example` is committed.
> Firebase web API keys are not cryptographic secrets — they identify the
> project — but keeping them out of version control is good hygiene, and access
> is ultimately controlled by the security rules below.

## Deploy the security rules

The rules live in the repo root: `firestore.rules`, `storage.rules`, and
`firebase.json`. Either paste them into the console (Firestore → Rules /
Storage → Rules), or deploy with the Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
firebase use --add        # select your new project
firebase deploy --only firestore:rules,storage
```

## Data model

```
users/{uid}                      -> UserProfile
users/{uid}/activities/{id}      -> SpiritualActivity (prayer | bible_reading | confession)
users/{uid}/journalEntries/{id}  -> JournalEntry
users/{uid}/stats/summary        -> UserStats (streaks + totals)
```

Each user can read/write only their own `users/{uid}/**` subtree.
