import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontFamilies, fontSizes, spacing } from "../../theme";
import { StatPill } from "./StatPill";
import type { MonthlyProgress } from "../../hooks/useMonthlyProgress";
import type { UserStats } from "../../types/models";

export interface ExtraStat {
  value: string;
  label: string;
  color?: string;
}

interface MonthlyStatsProps {
  progress: MonthlyProgress;
  /** Shows the streak line underneath when viewing the current month. */
  stats?: UserStats | null;
  /** Discipline-specific figures appended after the shared three. */
  extra?: ExtraStat[];
}

/**
 * The "Monthly Stats" block every tracker shares: days done, days missed and
 * consistency, plus any discipline-specific figures, with the streak underneath.
 */
export function MonthlyStats({ progress, stats, extra }: MonthlyStatsProps) {
  const pills: ExtraStat[] = [
    {
      value: String(progress.daysCompleted),
      label: "Days",
      color: colors.primary,
    },
    { value: String(progress.daysMissed), label: "Missed", color: "#CBD5E1" },
    {
      value: `${progress.consistency}%`,
      label: "Consistency",
      color: colors.primaryGold,
    },
    ...(extra ?? []),
  ];

  // Three fit across comfortably; four would be cramped, so they pair up 2x2.
  const rows =
    pills.length === 4 ? [pills.slice(0, 2), pills.slice(2)] : [pills];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Monthly Stats</Text>
      {rows.map((row, i) => (
        <View key={i} style={styles.statsRow}>
          {row.map((pill) => (
            <StatPill
              key={pill.label}
              value={pill.value}
              label={pill.label}
              color={pill.color ?? colors.primary}
            />
          ))}
        </View>
      ))}
      {stats && progress.isCurrentMonth ? (
        <Text style={styles.streakNote}>
          Current streak: {stats.currentStreak} day
          {stats.currentStreak === 1 ? "" : "s"} · Longest:{" "}
          {stats.longestStreak}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  streakNote: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
