/**
 * Guided retreat curricula. Each plan has one content entry per day; the
 * passage drives the day's Bible task target, and the prompt seeds journaling.
 */
export interface RetreatDayContent {
  theme: string;
  passage: string; // a single chapter, e.g. "Psalm 46"
  verse: string; // short line to display
  prompt: string; // journaling reflection prompt
}

export interface RetreatPlan {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  content: RetreatDayContent[]; // content.length === days
}

const THREE_DAY: RetreatDayContent[] = [
  {
    theme: "Stillness",
    passage: "Psalm 46",
    verse: "Be still, and know that I am God.",
    prompt: "Where in your life do you most need to be still before God today?",
  },
  {
    theme: "Surrender",
    passage: "Matthew 11",
    verse: "Come unto me, all ye that labour, and I will give you rest.",
    prompt: "What burden are you carrying that you can lay down today?",
  },
  {
    theme: "Renewal",
    passage: "Psalm 51",
    verse: "Create in me a clean heart, O God.",
    prompt: "Where do you sense God renewing or restoring you?",
  },
];

const SEVEN_DAY: RetreatDayContent[] = [
  {
    theme: "Stillness",
    passage: "Psalm 46",
    verse: "Be still, and know that I am God.",
    prompt: "Where do you most need to be still before God today?",
  },
  {
    theme: "Trust",
    passage: "Proverbs 3",
    verse: "Trust in the Lord with all thine heart.",
    prompt: "What are you tempted to lean on your own understanding for?",
  },
  {
    theme: "Rest",
    passage: "Matthew 11",
    verse: "I will give you rest.",
    prompt: "What weight can you hand to Jesus today?",
  },
  {
    theme: "The Shepherd",
    passage: "Psalm 23",
    verse: "The Lord is my shepherd; I shall not want.",
    prompt: "Where has God provided or led you through a hard valley?",
  },
  {
    theme: "Love",
    passage: "1 Corinthians 13",
    verse: "And now abideth faith, hope, charity, these three.",
    prompt: "Who is God calling you to love more patiently?",
  },
  {
    theme: "Renewal",
    passage: "Psalm 51",
    verse: "Create in me a clean heart, O God.",
    prompt: "What do you want to confess and leave behind?",
  },
  {
    theme: "Sending",
    passage: "Isaiah 6",
    verse: "Here am I; send me.",
    prompt: "What is God inviting you toward as this retreat ends?",
  },
];

const FOURTEEN_DAY: RetreatDayContent[] = [
  ...SEVEN_DAY,
  {
    theme: "Light",
    passage: "John 1",
    verse: "The light shineth in darkness.",
    prompt: "Where do you need God's light right now?",
  },
  {
    theme: "Abiding",
    passage: "John 15",
    verse: "Abide in me, and I in you.",
    prompt: "What helps you stay connected to God through the day?",
  },
  {
    theme: "Gratitude",
    passage: "Psalm 103",
    verse: "Bless the Lord, O my soul.",
    prompt: "Name five specific things you're grateful for today.",
  },
  {
    theme: "Humility",
    passage: "Philippians 2",
    verse: "Let this mind be in you, which was also in Christ Jesus.",
    prompt: "Where can you choose humility over being right?",
  },
  {
    theme: "Perseverance",
    passage: "Hebrews 12",
    verse: "Let us run with patience the race that is set before us.",
    prompt: "What weight or distraction slows your walk with God?",
  },
  {
    theme: "Hope",
    passage: "Romans 8",
    verse: "We are more than conquerors through him that loved us.",
    prompt: "Where do you need hope to take root today?",
  },
  {
    theme: "Sending",
    passage: "Matthew 28",
    verse: "Lo, I am with you alway, even unto the end of the world.",
    prompt: "How will you carry this retreat into your everyday life?",
  },
];

export const RETREAT_PLANS: RetreatPlan[] = [
  {
    id: "3-day-stillness",
    title: "3-Day Stillness",
    subtitle: "A short reset: stillness, surrender, renewal.",
    days: 3,
    content: THREE_DAY,
  },
  {
    id: "7-day-journey",
    title: "7-Day Journey",
    subtitle: "A week walking through the heart of Scripture.",
    days: 7,
    content: SEVEN_DAY,
  },
  {
    id: "14-day-deepening",
    title: "14-Day Deepening",
    subtitle: "Two weeks to go deeper and be sent out.",
    days: 14,
    content: FOURTEEN_DAY,
  },
];

export function retreatPlan(id: string | undefined): RetreatPlan | undefined {
  return RETREAT_PLANS.find((p) => p.id === id);
}

/** The content for a given 1-based day of a guided plan (clamped). */
export function retreatDayContent(
  planId: string | undefined,
  dayIndex: number,
): RetreatDayContent | undefined {
  const plan = retreatPlan(planId);
  if (!plan) return undefined;
  return plan.content[Math.min(Math.max(dayIndex, 1), plan.days) - 1];
}
