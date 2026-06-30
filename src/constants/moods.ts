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
  /**
   * Varied keyword sets used for the LoremFlickr source. Mixing close-ups,
   * objects and textures with scenery keeps the feed from being all wide
   * landscape shots.
   */
  imageKeywords: string[];
  /** Hand-picked Unsplash photos that fit the mood. */
  images: string[];
}

/**
 * Build a square, optimized Unsplash URL from a raw photo id. A square crop
 * (rather than the photo's native, usually-wide ratio) reads less like a
 * landscape and sits better in the card/thumbnail frames.
 */
function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?q=80&w=600&h=600&fit=crop&crop=entropy&auto=format`;
}

export const MOODS: Mood[] = [
  {
    label: 'Grateful',
    emoji: '🙏',
    imageKeywords: ['gratitude,candle', 'flowers,bouquet', 'hands,prayer'],
    images: [
      unsplash('1470071459604-3b5ec3a7fe05'),
      unsplash('1500534623283-312aade485b7'),
    ],
  },
  {
    label: 'Peaceful',
    emoji: '😌',
    imageKeywords: ['tea,cup', 'candle,still', 'meditation,zen'],
    images: [
      unsplash('1501785888041-af3ef285b470'),
      unsplash('1439066615861-d1af74d74000'),
    ],
  },
  {
    label: 'Hopeful',
    emoji: '🌅',
    imageKeywords: ['light,window', 'sprout,plant', 'open,book'],
    images: [
      unsplash('1504608524841-42fe6f032b4b'),
      unsplash('1490730141103-6cac27aaab94'),
    ],
  },
  {
    label: 'Joyful',
    emoji: '😊',
    imageKeywords: ['flowers,closeup', 'confetti,color', 'balloons,party'],
    images: [
      unsplash('1490750967868-88aa4486c946'),
      unsplash('1462275646964-a0e3386b89fa'),
    ],
  },
  {
    label: 'Reflective',
    emoji: '🤔',
    imageKeywords: ['book,coffee', 'journal,desk', 'rain,window'],
    images: [
      unsplash('1504052434569-70ad5836ab65'),
      unsplash('1448375240586-882707db888b'),
    ],
  },
  {
    label: 'Struggling',
    emoji: '💧',
    imageKeywords: ['rain,window', 'candle,dark', 'quiet,solitude'],
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
 * mood's curated Unsplash photos and several keyword-matched LoremFlickr images
 * (varied subjects, square crop) — so the feed stays varied and isn't dominated
 * by wide landscape shots. The per-entry hash keeps the choice stable, so an
 * entry always shows the same picture.
 */
export function imageForEntry(seed: string, mood?: string): string {
  // Fall back to a default mood so entries without one still get the full pool.
  const m = getMood(mood) ?? DEFAULT_MOOD;
  const hash = hashString(seed);

  const loremflickr = m.imageKeywords.map(
    (kw, i) => `https://loremflickr.com/600/600/${kw}?lock=${hash + i}`
  );

  // Pool weights the varied keyword shots over the (landscape-leaning) curated
  // photos, then picks one deterministically by hash.
  const pool = [...m.images, ...loremflickr];
  return pool[hash % pool.length];
}
