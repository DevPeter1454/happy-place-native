/**
 * Where support requests go. Change these to the project's real channels — they
 * are the only user-facing contact details in the app.
 */
export const SUPPORT_EMAIL = 'support@happyplace.app';

export interface FaqEntry {
  question: string;
  answer: string;
}

export const FAQ: FaqEntry[] = [
  {
    question: 'How does my streak work?',
    answer:
      'Your streak grows by one for each day you log at least one prayer, Bible reading or confession. It resets if a whole day passes with nothing logged, and your longest streak is kept either way.',
  },
  {
    question: 'Why am I not getting my daily reminder?',
    answer:
      'Check that Daily Reminders is on in Profile, that a reminder time is set, and that notifications are allowed for Happy Place in your device settings. Reminders are local to your device, so they also stop if the app is uninstalled.',
  },
  {
    question: 'Is my journal private?',
    answer:
      'Yes. Journal entries, prayers and confessions are stored under your own account and the security rules only allow you to read or write them. Nobody else — including other Happy Place users — can see them.',
  },
  {
    question: 'Can I use Happy Place on more than one device?',
    answer:
      'Yes. Sign in with the same email on each device and your profile, journal, prayers and retreat progress sync automatically.',
  },
  {
    question: 'What happens to a retreat if I miss a day?',
    answer:
      'Nothing is lost. Retreat tasks are tracked per day and are independent of your streak, so you can come back and continue where you left off.',
  },
];
