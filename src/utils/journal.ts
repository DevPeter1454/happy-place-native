import type { JournalEntry } from "../types/models";
import type { RootStackParamList } from "../navigation/types";

/** A journal entry's creation date, falling back to now if unset. */
export function entryDate(entry: JournalEntry): Date {
  return entry.createdAt ? entry.createdAt.toDate() : new Date();
}

/**
 * Route params for opening an entry in the detail screen.
 *
 * Shared so every caller sends the same fields — nav params must be
 * serializable, hence the Timestamp becoming epoch milliseconds.
 */
export function journalDetailParams(
  entry: JournalEntry
): RootStackParamList["JournalEntryDetail"] {
  return {
    entryId: entry.id,
    title: entry.title,
    body: entry.body,
    mood: entry.mood,
    createdAt: entryDate(entry).getTime(),
    isFavorite: entry.isFavorite,
  };
}
