/**
 * Shared mood definitions for journaling.
 *
 * A single source of truth for the moods shown in the New Reflection picker
 * and rendered back on the Journal list. Each mood also maps to image search
 * keywords so a list entry can show a picture that fits how the user felt.
 */

export interface Mood {
  label: string;
  emoji: string;
  /** Comma-separated keywords used for the LoremFlickr (keyword) source. */
  imageKeywords: string;
  /** Hand-picked Unsplash photos that fit the mood. */
  images: string[];
}

/** Build a sized, optimized Unsplash URL from a raw photo id. */
function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?q=80&w=800&auto=format&fit=crop`;
}

export const MOODS: Mood[] = [
  {
    label: 'Grateful',
    emoji: '🙏',
    imageKeywords: 'sunrise,nature',
    images: [
      unsplash('1470071459604-3b5ec3a7fe05'),
      unsplash('1500534623283-312aade485b7'),
    ],
  },
  {
    label: 'Peaceful',
    emoji: '😌',
    imageKeywords: 'calm,lake',
    images: [
      unsplash('1501785888041-af3ef285b470'),
      unsplash('1439066615861-d1af74d74000'),
    ],
  },
  {
    label: 'Hopeful',
    emoji: '🌅',
    imageKeywords: 'sky,horizon',
    images: [
      unsplash('1504608524841-42fe6f032b4b'),
      unsplash('1490730141103-6cac27aaab94'),
    ],
  },
  {
    label: 'Joyful',
    emoji: '😊',
    imageKeywords: 'flowers,sunshine',
    images: [
      unsplash('1490750967868-88aa4486c946'),
      unsplash('1462275646964-a0e3386b89fa'),
    ],
  },
  {
    label: 'Reflective',
    emoji: '🤔',
    imageKeywords: 'forest,mist',
    images: [
      unsplash('1504052434569-70ad5836ab65'),
      unsplash('1448375240586-882707db888b'),
    ],
  },
  {
    label: 'Struggling',
    emoji: '💧',
    imageKeywords: 'rain,ocean',
    images: [
      unsplash('1428592953211-077101b2021b'),
      unsplash('1500674425229-f692875b0ab7'),
    ],
  },
];

export const DEFAULT_MOOD = MOODS[0];

export function getMood(label: string | undefined): Mood | undefined {
  return MOODS.find((m) => m.label === label);
}

/** Stable 31-bit hash of a string, used to keep an entry's image consistent. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash);
}

/**
 * A picture that fits the entry's feeling. We rotate across two sources — the
 * mood's curated Unsplash photos and a keyword-matched LoremFlickr image — so
 * the feed stays varied. The per-entry hash keeps the choice (and the
 * LoremFlickr `lock`) stable, so an entry always shows the same picture.
 */
export function imageForEntry(seed: string, mood?: string): string {
  // Fall back to a default mood so entries without one still rotate across
  // curated photos rather than only ever showing a LoremFlickr image.
  const m = getMood(mood) ?? DEFAULT_MOOD;
  const hash = hashString(seed);
  const loremflickr = `https://loremflickr.com/640/480/${m.imageKeywords}?lock=${hash}`;

  // Pool = curated Unsplash photos + the LoremFlickr fallback; pick one by hash.
  const pool = [...m.images, loremflickr];
  return pool[hash % pool.length];
}
