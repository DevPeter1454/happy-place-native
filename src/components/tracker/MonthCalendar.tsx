import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../../theme";
import type { DayStatus, MonthlyProgress } from "../../hooks/useMonthlyProgress";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface MonthCalendarProps {
  progress: MonthlyProgress;
  /**
   * When provided, days up to today become tappable. Future days stay inert —
   * there is nothing to show for a day that hasn't happened.
   */
  onSelectDay?: (day: number) => void;
  /** Legend wording for a completed day, e.g. "Prayed" or "Read". */
  completedLabel?: string;
}

/**
 * A month grid of completed / missed / today / future days, with month paging
 * and a legend. Shared by the prayer and Bible trackers.
 */
export function MonthCalendar({
  progress,
  onSelectDay,
  completedLabel = "Completed",
}: MonthCalendarProps) {
  const {
    monthName,
    firstWeekday,
    days,
    isCurrentMonth,
    dayStatus,
    isDayViewable,
    goPrevMonth,
    goNextMonth,
  } = progress;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>History</Text>
        <View style={styles.monthLabel}>
          <Pressable
            onPress={goPrevMonth}
            hitSlop={8}
            style={({ pressed }) => (pressed ? styles.navPressed : null)}
          >
            <ChevronLeft size={18} color={colors.primary} />
          </Pressable>
          <Text style={styles.monthText}>{monthName}</Text>
          <Pressable
            onPress={goNextMonth}
            hitSlop={8}
            disabled={isCurrentMonth}
            style={({ pressed }) => (pressed ? styles.navPressed : null)}
          >
            <ChevronRight
              size={18}
              color={isCurrentMonth ? colors.primaryLight30 : colors.primary}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.grid}>
          {DAY_LABELS.map((label, i) => (
            <View key={`label-${i}`} style={styles.dayLabelCell}>
              <Text style={styles.dayLabelText}>{label}</Text>
            </View>
          ))}

          {/* Leading blanks so day 1 lands under its weekday */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.dayWrapper} />
          ))}

          {days.map((day) => (
            <CalendarDay
              key={day}
              day={day}
              status={dayStatus(day)}
              onPress={
                onSelectDay && isDayViewable(day)
                  ? () => onSelectDay(day)
                  : undefined
              }
            />
          ))}
        </View>

        <View style={styles.legend}>
          <LegendItem color={colors.primary} label={completedLabel} />
          <LegendItem color={colors.missedBg} label="Missed" />
          <LegendItem borderColor={colors.primary} label="Today" />
        </View>

        {onSelectDay ? (
          <Text style={styles.tapHint}>
            Tap any past day to see its verse.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function CalendarDay({
  day,
  status,
  onPress,
}: {
  day: number;
  status: DayStatus;
  onPress?: () => void;
}) {
  const palette = paletteFor(status);

  const circle = (pressed: boolean) => [
    styles.circle,
    { backgroundColor: palette.bg },
    status === "today" && styles.todayBorder,
    pressed && styles.dayPressed,
  ];

  if (!onPress) {
    return (
      <View style={styles.dayWrapper}>
        <View style={circle(false)}>
          <Text style={[styles.dayText, { color: palette.text }]}>{day}</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.dayWrapper}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Day ${day}`}
    >
      {({ pressed }) => (
        <View style={circle(pressed)}>
          <Text style={[styles.dayText, { color: palette.text }]}>{day}</Text>
        </View>
      )}
    </Pressable>
  );
}

function paletteFor(status: DayStatus): { bg: string; text: string } {
  switch (status) {
    case "completed":
      return { bg: colors.primary, text: colors.white };
    case "missed":
      return { bg: colors.missedBg, text: colors.missed };
    case "today":
      return { bg: "transparent", text: colors.primary };
    case "future":
    default:
      return { bg: "transparent", text: "#CBD5E1" };
  }
}

function LegendItem({
  color,
  borderColor,
  label,
}: {
  color?: string;
  borderColor?: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          color ? { backgroundColor: color } : undefined,
          borderColor
            ? { borderWidth: 2, borderColor, backgroundColor: "transparent" }
            : undefined,
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  monthLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "500",
    color: colors.textPlaceholder,
    minWidth: 96,
    textAlign: "center",
  },
  navPressed: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayLabelCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 6,
  },
  dayLabelText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textPlaceholder,
    textTransform: "uppercase",
  },
  dayWrapper: {
    width: "14.28%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPressed: {
    opacity: 0.55,
    transform: [{ scale: 0.92 }],
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "700",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight05,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  tapHint: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
