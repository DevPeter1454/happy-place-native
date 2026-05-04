import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import {
  ArrowLeft,
  Settings,
  BellRing,
  CheckCircle2,
  CalendarDays,
} from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import type { RootStackScreenProps } from "../navigation/types";

// --- Mock data ---
const MONTH_NAME = "October 2023";
const DAYS_IN_MONTH = 28; // 4-week calendar for simplicity
const FIRST_DAY_OFFSET = 0; // Monday start
const COMPLETED_DAYS = [
  1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23,
];
const MISSED_DAYS = [6, 17];
const TODAY = 24;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type DayStatus = "completed" | "missed" | "today" | "future";

function getDayStatus(day: number): DayStatus {
  if (day === TODAY) return "today";
  if (COMPLETED_DAYS.includes(day)) return "completed";
  if (MISSED_DAYS.includes(day)) return "missed";
  return "future";
}

// --- Stat Pill Component ---
function StatPill({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={statPillStyles.container}>
      <Text style={[statPillStyles.value, { color }]}>{value}</Text>
      <Text style={statPillStyles.label}>{label}</Text>
    </View>
  );
}

const statPillStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  value: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textPlaceholder,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
});

// --- Calendar Day Component ---
function CalendarDay({ day, status }: { day: number; status: DayStatus }) {
  const dayStyles = useMemo(() => {
    switch (status) {
      case "completed":
        return { bg: colors.primary, text: colors.white };
      case "missed":
        return { bg: colors.missedBg, text: colors.missed };
      case "today":
        return { bg: "transparent", text: colors.primary, border: true };
      case "future":
      default:
        return { bg: "transparent", text: "#CBD5E1" };
    }
  }, [status]);

  return (
    <View style={calDayStyles.wrapper}>
      <View
        style={[
          calDayStyles.circle,
          { backgroundColor: dayStyles.bg },
          status === "today" && calDayStyles.todayBorder,
        ]}
      >
        <Text style={[calDayStyles.text, { color: dayStyles.text }]}>
          {day}
        </Text>
      </View>
    </View>
  );
}

const calDayStyles = StyleSheet.create({
  wrapper: {
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
  todayBorder: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  text: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "700",
  },
});

// --- Legend Component ---
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
    <View style={legendStyles.item}>
      <View
        style={[
          legendStyles.dot,
          color ? { backgroundColor: color } : undefined,
          borderColor
            ? { borderWidth: 2, borderColor, backgroundColor: "transparent" }
            : undefined,
        ]}
      />
      <Text style={legendStyles.label}>{label}</Text>
    </View>
  );
}

const legendStyles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
});

// --- Main Screen ---
export function PrayerTrackerScreen({
  navigation,
}: RootStackScreenProps<"PrayerTracker">) {
  const insets = useSafeAreaInsets();

  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);
  const totalCompleted = COMPLETED_DAYS.length;
  const totalMissed = MISSED_DAYS.length;
  const consistency = Math.round(
    (totalCompleted / (totalCompleted + totalMissed)) * 100,
  );

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 400 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && styles.headerBtnPressed,
          ]}
        >
          <ArrowLeft size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Prayer Tracker</Text>
        <Pressable
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && styles.headerBtnPressed,
          ]}
        >
          <Settings size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Reminder Card */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderLeft}>
            <View style={styles.reminderIcon}>
              <BellRing size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.reminderLabel}>Daily Reminder</Text>
              <Text style={styles.reminderTime}>8:00 PM</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.editBtn,
              pressed && styles.editBtnPressed,
            ]}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>

        {/* Mark Prayer Completed Button */}
        <Pressable
          style={({ pressed }) => [
            styles.markButton,
            pressed && styles.markButtonPressed,
          ]}
        >
          <CheckCircle2 size={22} color={colors.white} />
          <Text style={styles.markButtonText}>Mark Prayer Completed</Text>
        </Pressable>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Stats</Text>
          <View style={styles.statsRow}>
            <StatPill
              value={String(totalCompleted)}
              label="Days"
              color={colors.primary}
            />
            <StatPill
              value={String(totalMissed)}
              label="Missed"
              color="#CBD5E1"
            />
            <StatPill
              value={`${consistency}%`}
              label="Consistency"
              color={colors.primaryGold}
            />
          </View>
        </View>

        {/* History Calendar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History</Text>
            <View style={styles.monthLabel}>
              <Text style={styles.monthText}>{MONTH_NAME}</Text>
              <CalendarDays size={14} color={colors.textPlaceholder} />
            </View>
          </View>

          <View style={styles.calendarCard}>
            {/* Day labels */}
            <View style={styles.calendarGrid}>
              {DAY_LABELS.map((label, i) => (
                <View key={`label-${i}`} style={styles.dayLabelCell}>
                  <Text style={styles.dayLabelText}>{label}</Text>
                </View>
              ))}

              {/* Calendar days */}
              {days.map((day) => (
                <CalendarDay key={day} day={day} status={getDayStatus(day)} />
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <LegendItem color={colors.primary} label="Completed" />
              <LegendItem color={colors.missedBg} label="Missed" />
              <LegendItem borderColor={colors.primary} label="Today" />
            </View>
          </View>
        </View>
      </ScrollView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing["2xl"],
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnPressed: {
    backgroundColor: colors.primaryLight,
  },
  headerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.primary,
  },

  // Reminder card
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  reminderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: colors.textMuted,
  },
  reminderTime: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  editBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  editBtnPressed: {
    backgroundColor: colors.primaryLight30,
  },
  editBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },

  // Mark button
  markButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    ...shadows.lg,
  },
  markButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  markButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },

  // Sections
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
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
  },

  // Calendar
  calendarCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  calendarGrid: {
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

  // Legend
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight05,
  },
});
