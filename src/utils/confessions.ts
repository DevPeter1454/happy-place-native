import type { SpiritualActivity } from "../types/models";

export interface ParsedConfession {
  id: string;
  /** The affirmation itself. */
  text: string;
  /** Optional scripture reference the user attached. */
  verse?: string;
  date: Date;
  completed: boolean;
}

/**
 * Confessions are stored as `confession` activities whose `notes` hold the
 * affirmation text and (optionally) a scripture reference, separated by a blank
 * line — the format written by AddConfessionScreen.
 *
 * Shared so the dashboard preview and the confession list can't drift apart on
 * how that text is split.
 */
export function parseConfession(activity: SpiritualActivity): ParsedConfession {
  const notes = activity.notes ?? "";
  const [text, ...rest] = notes.split("\n\n");
  const verse = rest.join("\n\n").trim();
  return {
    id: activity.id,
    text: text.trim() || "(No text)",
    verse: verse || undefined,
    date: activity.date ? activity.date.toDate() : new Date(),
    completed: !!activity.completed,
  };
}
