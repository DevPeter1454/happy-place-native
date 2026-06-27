// Dynamic Expo config.
//
// The static, non-secret app configuration lives in app.json (committed). This
// file layers the Firebase credentials on top, read from environment variables
// (see .env / .env.example) so secrets never get committed. Expo automatically
// loads .env files into process.env before evaluating this file.
//
// `config` is the resolved contents of app.json's `expo` key.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
  },
});
