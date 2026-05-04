import type { OnboardingPage } from '../types';

export const onboardingPages: OnboardingPage[] = [
  {
    id: 'welcome',
    title: 'Welcome to Happy Place',
    description:
      'Build a consistent relationship with God through prayer, reflection and discipline.',
    image:
      'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'grow',
    title: 'Grow Spiritually',
    description:
      'Track your prayer life, Bible reading, confessions and journaling.',
    illustrationType: 'growth',
  },
  {
    id: 'consistent',
    title: 'Stay Consistent',
    description: 'Small daily disciplines create strong spiritual growth.',
    image:
      'https://images.unsplash.com/photo-1515023115689-589c33041d3c?q=80&w=1974&auto=format&fit=crop',
  },
];
