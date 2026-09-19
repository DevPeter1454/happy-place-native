/**
 * Helpers for the daily-reminder clock time, stored in user preferences as a
 * "HH:MM" 24-hour string (e.g. "20:00").
 */

export const DEFAULT_REMINDER = '20:00';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Split a "HH:MM" string into clamped hour/minute, defaulting to 20:00. */
export function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((p) => parseInt(p, 10));
  return {
    hour: Number.isFinite(h) ? Math.min(Math.max(h, 0), 23) : 20,
    minute: Number.isFinite(m) ? Math.min(Math.max(m, 0), 59) : 0,
  };
}

/** Format a "HH:MM" 24h string as a friendly 12h label, e.g. "8:00 PM". */
export function formatTime(time: string): string {
  const { hour, minute } = parseTime(time);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad(minute)} ${period}`;
}

/** Today's date with its clock set to `time` — seeds a time picker. */
export function timeToDate(time: string): Date {
  const { hour, minute } = parseTime(time);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** The "HH:MM" string for a picked date's clock time. */
export function dateToTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Elapsed seconds as a stopwatch: "04:12", or "1:02:30" past an hour. */
export function formatStopwatch(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** A minute total as a compact human duration: "4h 20m", "45m", "0m". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
