import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MotiView } from "moti";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Settings,
  BellRing,
  Plus,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { listActivities, getStats } from "../services/activities.service";
import { updateProfile } from "../services/user.service";
import {
  ensurePermissions,
  scheduleDailyPrayerReminder,
} from "../services/notifications.service";
import { AddPrayerModal } from "../components/prayer/AddPrayerModal";
import type { SpiritualActivity, UserStats } from "../types/models";
import type { RootStackScreenProps } from "../navigation/types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DEFAULT_REMINDER = "20:00";

type DayStatus = "completed" | "missed" | "today" | "future";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a "HH:MM" 24h string as a friendly 12h label, e.g. "8:00 PM". */
function formatTime(time: string): string {
  const [h, m] = time.split(":").map((p) => parseInt(p, 10));
  const hour = Number.isFinite(h) ? h : 20;
  const minute = Number.isFinite(m) ? m : 0;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad(minute)} ${period}`;
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
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());

  const reloadPrayerData = useCallback(() => {
    if (!user?.uid) return;
    Promise.all([listActivities(user.uid, "prayer"), getStats(user.uid)])
      .then(([acts, s]) => {
        setActivities(acts);
        setStats(s);
      })
      .catch(() => {});
  }, [user?.uid]);

  const reminderTime = profile?.preferences?.reminderTime ?? DEFAULT_REMINDER;

  // Load this user's prayer activities + aggregate stats whenever focused.
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setActivities([]);
        setStats(null);
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      Promise.all([listActivities(user.uid, "prayer"), getStats(user.uid)])
        .then(([acts, s]) => {
          if (!active) return;
          setActivities(acts);
          setStats(s);
        })
        .catch(() => {
          if (!active) return;
          setActivities([]);
          setStats(null);
        })
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user?.uid]),
  );

  // "Now", captured once per mount — defines today and the latest viewable month.
  const now = useMemo(() => new Date(), []);
  const today = now.getDate();

  // The month currently being viewed; starts on the current month and can be
  // paged backwards through history but never ahead of the current month.
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
    { month: "long", year: "numeric" },
  );

  const goPrevMonth = () =>
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );
  const goNextMonth = () => {
    if (isCurrentMonth) return; // can't view months ahead of now
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );
  };

  // Day-of-month numbers with a logged prayer in the viewed month.
  const completedDays = useMemo(() => {
    const set = new Set<number>();
    for (const a of activities) {
      const d = a.date?.toDate?.();
      if (d && d.getFullYear() === view.year && d.getMonth() === view.month) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [activities, view]);

  const daysCompleted = completedDays.size;
  // Days that should have had a prayer but didn't: elapsed days of the current
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
    [completedDays, isCurrentMonth, isPastMonth, today],
  );

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const openPicker = () => {
    const [h, m] = reminderTime.split(":").map((p) => parseInt(p, 10));
    const d = new Date();
    d.setHours(Number.isFinite(h) ? h : 20, Number.isFinite(m) ? m : 0, 0, 0);
    setPickerValue(d);
    setPickerOpen(true);
  };

  const persistReminder = async (date: Date) => {
    if (!user?.uid) return;
    const newTime = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    try {
      const granted = await ensurePermissions();
      await updateProfile(user.uid, {
        preferences: {
          ...(profile?.preferences ?? { notifications: true }),
          reminderTime: newTime,
        },
      });
      await refreshProfile();
      if (granted) await scheduleDailyPrayerReminder(newTime);
      showToast(
        granted
          ? `Reminder set for ${formatTime(newTime)}`
          : "Saved — enable notifications to be reminded",
      );
    } catch {
      Alert.alert("Couldn't update reminder", "Please try again.");
    }
  };

  // Android shows a dialog and reports the result via onChange; iOS uses an
  // inline spinner inside a modal with an explicit Done button.
  const onAndroidPicked = (event: DateTimePickerEvent, date?: Date) => {
    setPickerOpen(false);
    if (event.type === "set" && date) persistReminder(date);
  };

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
          onPress={() => navigation.navigate("Main", { screen: "Profile" })}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && styles.headerBtnPressed,
          ]}
        >
          <Settings size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
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
                <Text style={styles.reminderTime}>{formatTime(reminderTime)}</Text>
              </View>
            </View>
            <Pressable
              onPress={openPicker}
              style={({ pressed }) => [
                styles.editBtn,
                pressed && styles.editBtnPressed,
              ]}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {/* Add Prayer */}
          <Pressable
            onPress={() => setAddOpen(true)}
            style={({ pressed }) => [
              styles.markButton,
              pressed && styles.markButtonPressed,
            ]}
          >
            <Plus size={22} color={colors.white} />
            <Text style={styles.markButtonText}>Add Prayer</Text>
          </Pressable>

          {/* My Prayers link */}
          <Pressable
            onPress={() => navigation.navigate("PrayerList")}
            style={({ pressed }) => [
              styles.myPrayersBtn,
              pressed && styles.editBtnPressed,
            ]}
          >
            <ScrollText size={18} color={colors.primary} />
            <Text style={styles.myPrayersText}>My Prayers</Text>
          </Pressable>

          {/* Monthly Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Stats</Text>
            <View style={styles.statsRow}>
              <StatPill
                value={String(daysCompleted)}
                label="Days"
                color={colors.primary}
              />
              <StatPill
                value={String(daysMissed)}
                label="Missed"
                color="#CBD5E1"
              />
              <StatPill
                value={`${consistency}%`}
                label="Consistency"
                color={colors.primaryGold}
              />
            </View>
            {stats && isCurrentMonth ? (
              <Text style={styles.streakNote}>
                Current streak: {stats.currentStreak} day
                {stats.currentStreak === 1 ? "" : "s"} · Longest:{" "}
                {stats.longestStreak}
              </Text>
            ) : null}
          </View>

          {/* History Calendar */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>History</Text>
              <View style={styles.monthLabel}>
                <Pressable
                  onPress={goPrevMonth}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.monthNavPressed}
                >
                  <ChevronLeft size={18} color={colors.primary} />
                </Pressable>
                <Text style={styles.monthText}>{monthName}</Text>
                <Pressable
                  onPress={goNextMonth}
                  hitSlop={8}
                  disabled={isCurrentMonth}
                  style={({ pressed }) => pressed && styles.monthNavPressed}
                >
                  <ChevronRight
                    size={18}
                    color={
                      isCurrentMonth ? colors.primaryLight30 : colors.primary
                    }
                  />
                </Pressable>
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

                {/* Leading blanks so day 1 lands under its weekday */}
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <View key={`blank-${i}`} style={calDayStyles.wrapper} />
                ))}

                {/* Calendar days */}
                {days.map((day) => (
                  <CalendarDay key={day} day={day} status={dayStatus(day)} />
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
      )}

      {/* Time picker */}
      {pickerOpen && Platform.OS === "android" ? (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          onChange={onAndroidPicked}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={pickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerOpen(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Daily Reminder Time</Text>
              <DateTimePicker
                value={pickerValue}
                mode="time"
                display="spinner"
                onChange={(_e, date) => date && setPickerValue(date)}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setPickerOpen(false)}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    pressed && styles.editBtnPressed,
                  ]}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPickerOpen(false);
                    persistReminder(pickerValue);
                  }}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    pressed && styles.markButtonPressed,
                  ]}
                >
                  <Text style={styles.modalBtnTextPrimary}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <AddPrayerModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={reloadPrayerData}
      />
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

  // My Prayers link
  myPrayersBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: -spacing.md,
  },
  myPrayersText: {
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
    minWidth: 96,
    textAlign: "center",
  },
  monthNavPressed: {
    opacity: 0.5,
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

  // Loading / states
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markButtonDisabled: {
    opacity: 0.6,
  },
  streakNote: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Time picker modal (iOS)
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  modalTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.primary,
  },
  modalBtnTextPrimary: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
});
