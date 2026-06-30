import type { HighlightColor } from '../types/models';

/** Background + border for each highlight color, used on dots and verse rows. */
export const HIGHLIGHT_COLORS: Record<
  HighlightColor,
  { bg: string; border: string }
> = {
  yellow: { bg: '#FEF9C3', border: '#FEF08A' },
  green: { bg: '#DCFCE7', border: '#BBF7D0' },
  blue: { bg: '#DBEAFE', border: '#BFDBFE' },
  pink: { bg: '#FCE7F3', border: '#FBCFE8' },
  orange: { bg: '#FFEDD5', border: '#FED7AA' },
};

/** Display order of the highlight swatches. */
export const HIGHLIGHT_ORDER: HighlightColor[] = [
  'yellow',
  'green',
  'blue',
  'pink',
  'orange',
];
