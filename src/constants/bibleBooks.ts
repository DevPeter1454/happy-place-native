/** The 66 books of the Protestant canon with their chapter counts. */
export interface BibleBook {
  name: string;
  chapters: number;
  testament: "OT" | "NT";
  /**
   * Verse count, only needed for single-chapter books: bible-api.com reads
   * "Obadiah 1" as verse 1, so the whole book must be requested as a range
   * ("Obadiah 1:1-21"). See apiPassageRef.
   */
  verses?: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "OT" },
  { name: "Exodus", chapters: 40, testament: "OT" },
  { name: "Leviticus", chapters: 27, testament: "OT" },
  { name: "Numbers", chapters: 36, testament: "OT" },
  { name: "Deuteronomy", chapters: 34, testament: "OT" },
  { name: "Joshua", chapters: 24, testament: "OT" },
  { name: "Judges", chapters: 21, testament: "OT" },
  { name: "Ruth", chapters: 4, testament: "OT" },
  { name: "1 Samuel", chapters: 31, testament: "OT" },
  { name: "2 Samuel", chapters: 24, testament: "OT" },
  { name: "1 Kings", chapters: 22, testament: "OT" },
  { name: "2 Kings", chapters: 25, testament: "OT" },
  { name: "1 Chronicles", chapters: 29, testament: "OT" },
  { name: "2 Chronicles", chapters: 36, testament: "OT" },
  { name: "Ezra", chapters: 10, testament: "OT" },
  { name: "Nehemiah", chapters: 13, testament: "OT" },
  { name: "Esther", chapters: 10, testament: "OT" },
  { name: "Job", chapters: 42, testament: "OT" },
  { name: "Psalms", chapters: 150, testament: "OT" },
  { name: "Proverbs", chapters: 31, testament: "OT" },
  { name: "Ecclesiastes", chapters: 12, testament: "OT" },
  { name: "Song of Solomon", chapters: 8, testament: "OT" },
  { name: "Isaiah", chapters: 66, testament: "OT" },
  { name: "Jeremiah", chapters: 52, testament: "OT" },
  { name: "Lamentations", chapters: 5, testament: "OT" },
  { name: "Ezekiel", chapters: 48, testament: "OT" },
  { name: "Daniel", chapters: 12, testament: "OT" },
  { name: "Hosea", chapters: 14, testament: "OT" },
  { name: "Joel", chapters: 3, testament: "OT" },
  { name: "Amos", chapters: 9, testament: "OT" },
  { name: "Obadiah", chapters: 1, testament: "OT", verses: 21 },
  { name: "Jonah", chapters: 4, testament: "OT" },
  { name: "Micah", chapters: 7, testament: "OT" },
  { name: "Nahum", chapters: 3, testament: "OT" },
  { name: "Habakkuk", chapters: 3, testament: "OT" },
  { name: "Zephaniah", chapters: 3, testament: "OT" },
  { name: "Haggai", chapters: 2, testament: "OT" },
  { name: "Zechariah", chapters: 14, testament: "OT" },
  { name: "Malachi", chapters: 4, testament: "OT" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "NT" },
  { name: "Mark", chapters: 16, testament: "NT" },
  { name: "Luke", chapters: 24, testament: "NT" },
  { name: "John", chapters: 21, testament: "NT" },
  { name: "Acts", chapters: 28, testament: "NT" },
  { name: "Romans", chapters: 16, testament: "NT" },
  { name: "1 Corinthians", chapters: 16, testament: "NT" },
  { name: "2 Corinthians", chapters: 13, testament: "NT" },
  { name: "Galatians", chapters: 6, testament: "NT" },
  { name: "Ephesians", chapters: 6, testament: "NT" },
  { name: "Philippians", chapters: 4, testament: "NT" },
  { name: "Colossians", chapters: 4, testament: "NT" },
  { name: "1 Thessalonians", chapters: 5, testament: "NT" },
  { name: "2 Thessalonians", chapters: 3, testament: "NT" },
  { name: "1 Timothy", chapters: 6, testament: "NT" },
  { name: "2 Timothy", chapters: 4, testament: "NT" },
  { name: "Titus", chapters: 3, testament: "NT" },
  { name: "Philemon", chapters: 1, testament: "NT", verses: 25 },
  { name: "Hebrews", chapters: 13, testament: "NT" },
  { name: "James", chapters: 5, testament: "NT" },
  { name: "1 Peter", chapters: 5, testament: "NT" },
  { name: "2 Peter", chapters: 3, testament: "NT" },
  { name: "1 John", chapters: 5, testament: "NT" },
  { name: "2 John", chapters: 1, testament: "NT", verses: 13 },
  { name: "3 John", chapters: 1, testament: "NT", verses: 14 },
  { name: "Jude", chapters: 1, testament: "NT", verses: 25 },
  { name: "Revelation", chapters: 22, testament: "NT" },
];

/** Common non-canonical spellings → canonical book name. */
const ALIASES: Record<string, string> = {
  psalm: "Psalms",
  "song of songs": "Song of Solomon",
  songs: "Song of Solomon",
  canticles: "Song of Solomon",
};

export function getBook(name: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.name.toLowerCase() === name.toLowerCase());
}

/**
 * The reference to send to bible-api.com for a whole chapter. Single-chapter
 * books must be requested as an explicit verse range, since "Obadiah 1" is read
 * as verse 1 rather than the whole book.
 */
export function apiPassageRef(book: string, chapter: number): string {
  const b = getBook(book);
  if (b && b.chapters === 1 && b.verses) return `${book} 1:1-${b.verses}`;
  return `${book} ${chapter}`;
}

/**
 * Parse a passage reference like "Psalm 23" or "1 Corinthians 13" into a
 * canonical book name + chapter, clamped to the book's chapter count. Returns
 * null if the book can't be resolved.
 */
export function parsePassageRef(
  ref: string,
): { book: string; chapter: number } | null {
  const match = ref.trim().match(/^(.*?)\s+(\d+)$/);
  if (!match) return null;
  const name = match[1].trim();
  const chapter = parseInt(match[2], 10);

  let book = getBook(name);
  if (!book) {
    const canon = ALIASES[name.toLowerCase()];
    if (canon) book = getBook(canon);
  }
  if (!book) return null;

  return { book: book.name, chapter: Math.min(Math.max(chapter, 1), book.chapters) };
}
