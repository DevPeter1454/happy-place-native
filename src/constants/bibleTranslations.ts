/** Translations available from bible-api.com (all public domain / free). */
export interface BibleTranslation {
  /** API translation id passed as ?translation=. */
  id: string;
  /** Full display name. */
  name: string;
  /** Short label shown in the header chip. */
  abbr: string;
}

export const TRANSLATIONS: BibleTranslation[] = [
  { id: "kjv", name: "King James Version", abbr: "KJV" },
  { id: "web", name: "World English Bible", abbr: "WEB" },
  { id: "webbe", name: "World English Bible (British)", abbr: "WEBBE" },
  { id: "bbe", name: "Bible in Basic English", abbr: "BBE" },
  { id: "oeb-us", name: "Open English Bible (US)", abbr: "OEB-US" },
  { id: "oeb-cw", name: "Open English Bible (Commonwealth)", abbr: "OEB-CW" },
];

export const DEFAULT_TRANSLATION = "kjv";

export function translationFor(id: string): BibleTranslation {
  return TRANSLATIONS.find((t) => t.id === id) ?? TRANSLATIONS[0];
}
