import { useCallback, useMemo, useState } from "react";

export type DayStatus = "completed" | "missed" | "today" | "future";

export interface MonthlyProgress {
  /** "Now", captured once per mount — defines today and the newest viewable month. */
  now: Date;
  /** Day-of-month for today. */
  today: number;
  view: { year: number; month: number };
  /** e.g. "September 2026". */
  monthName: string;
  daysInMonth: number;
  /** Column index (Monday = 0) that day 1 falls under. */
  firstWeekday: number;
  days: number[];
  isCurrentMonth: boolean;
  /** Day-of-month numbers with a logged activity in the viewed month. */
  completedDays: Set<number>;
  daysCompleted: number;
  daysMissed: number;
  /** Completed as a percentage of days that have elapsed. */
  consistency: number;
  /** Whether today has a logged activity, regardless of the month being viewed. */
  todayLogged: boolean;
  dayStatus: (day: number) => DayStatus;
  /** Whether a day is in the past or today — i.e. has a verse/history to show. */
  isDayViewable: (day: number) => boolean;
  goPrevMonth: () => void;
  goNextMonth: () => void;
}

/**
 * Month-by-month progress derived from the dates on which something was logged:
 * which days count as done, the monthly figures, and paging through history.
 *
 * Takes plain `Date`s rather than activities so journal entries (which date from
 * `createdAt`) use the same logic as activities (which date from `date`), and
 * every tracker agrees on what "missed" and "consistency" mean.
 */
export function useMonthlyProgress(dates: Date[]): MonthlyProgress {
  const now = useMemo(() => new Date(), []);
  const today = now.getDate();

  // The month being viewed; pages backwards through history but never ahead.
  const [view, setView] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const isCurrentMonth =
    view.year === now.getFullYear() && view.month === now.getMonth();
  const isPastMonth =
    view.year < now.getFullYear() ||
    (view.year === now.getFullYear() && view.month < now.getMonth());

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // Monday-start grid: shift Sun(0)..Sat(6) so Monday is column 0.
  const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const monthName = new Date(view.year, view.month, 1).toLocaleString(
    "default",
    { month: "long", year: "numeric" }
  );

  const goPrevMonth = useCallback(() => {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 }
    );
  }, []);

  const goNextMonth = useCallback(() => {
    setView((v) => {
      const atCurrent =
        v.year === now.getFullYear() && v.month === now.getMonth();
      if (atCurrent) return v; // can't view months ahead of now
      return v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 };
    });
  }, [now]);

  const completedDays = useMemo(() => {
    const set = new Set<number>();
    for (const d of dates) {
      if (d.getFullYear() === view.year && d.getMonth() === view.month) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [dates, view]);

  const todayLogged = useMemo(
    () =>
      dates.some(
        (d) =>
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === today
      ),
    [dates, now, today]
  );

  const daysCompleted = completedDays.size;
  // Days that should have had an entry but didn't: elapsed days of the current
  // month, or every day of a fully-past month.
  const daysMissed = useMemo(() => {
    const upTo = isCurrentMonth ? today - 1 : isPastMonth ? daysInMonth : 0;
    let missed = 0;
    for (let d = 1; d <= upTo; d++) if (!completedDays.has(d)) missed++;
    return missed;
  }, [completedDays, isCurrentMonth, isPastMonth, today, daysInMonth]);

  const consistency =
    daysCompleted + daysMissed > 0
      ? Math.round((daysCompleted / (daysCompleted + daysMissed)) * 100)
      : 0;

  const dayStatus = useCallback(
    (day: number): DayStatus => {
      if (completedDays.has(day)) return "completed";
      if (isCurrentMonth) {
        if (day === today) return "today";
        return day < today ? "missed" : "future";
      }
      return isPastMonth ? "missed" : "future";
    },
    [completedDays, isCurrentMonth, isPastMonth, today]
  );

  const isDayViewable = useCallback(
    (day: number) => (isCurrentMonth ? day <= today : isPastMonth),
    [isCurrentMonth, isPastMonth, today]
  );

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  return {
    now,
    today,
    view,
    monthName,
    daysInMonth,
    firstWeekday,
    days,
    isCurrentMonth,
    completedDays,
    daysCompleted,
    daysMissed,
    consistency,
    todayLogged,
    dayStatus,
    isDayViewable,
    goPrevMonth,
    goNextMonth,
  };
}
