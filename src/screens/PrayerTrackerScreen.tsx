import React, { useMemo, useState } from "react";
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
import { MotiView } from "moti";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  Settings,
  BellRing,
  Plus,
  ScrollText,
  ChevronLeft,
  Check,
  CheckCircle2,
  Play,
  Square,
  X,
  Timer,
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
import {
  addActivity,
  listActivities,
  getStats,
} from "../services/activities.service";
import { updateProfile } from "../services/user.service";
import {
  ensurePermissions,
  scheduleDailyPrayerReminder,
} from "../services/notifications.service";
import { cacheKeys } from "../services/cache";
import { useCachedData } from "../hooks/useCachedData";
import { MonthlyStats } from "../components/tracker/MonthlyStats";
import { MonthCalendar } from "../components/tracker/MonthCalendar";
import { useMonthlyProgress } from "../hooks/useMonthlyProgress";
import { usePrayerTimer } from "../hooks/usePrayerTimer";
import {
  DEFAULT_REMINDER,
  dateToTime,
  formatDuration,
  formatStopwatch,
  formatTime,
  timeToDate,
} from "../utils/time";
import type { RootStackScreenProps } from "../navigation/types";

// --- Main Screen ---
export function PrayerTrackerScreen({
  navigation,
}: RootStackScreenProps<"PrayerTracker">) {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [marking, setMarking] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());

  const uid = user?.uid;
  const { data, loading, refresh: reloadPrayerData } = useCachedData(
    uid ? cacheKeys.prayerTracker(uid) : null,
    async () => {
      const [activities, stats] = await Promise.all([
        listActivities(uid!, "prayer"),
        getStats(uid!),
      ]);
      return { activities, stats };
    },
  );
  const activities = data?.activities ?? [];
  const stats = data?.stats ?? null;

  const reminderTime = profile?.preferences?.reminderTime ?? DEFAULT_REMINDER;

  const timer = usePrayerTimer();

  /**
   * End the session and log it. The activity carries the duration, so stopping
   * the timer also marks today done — it's the richer form of "mark as done".
   */
  const stopAndLog = async () => {
    const minutes = await timer.stop();
    if (minutes === null || !user?.uid) return;
    try {
      await addActivity(user.uid, { type: "prayer", durationMinutes: minutes });
      await reloadPrayerData();
      showToast(`Logged ${formatDuration(minutes)} of prayer 🙏`);
    } catch {
      Alert.alert(
        "Couldn't save",
        `Your ${formatDuration(minutes)} wasn't recorded. Please try again.`,
      );
    }
  };

  const confirmDiscard = () => {
    Alert.alert("Discard this session?", "The time won't be recorded.", [
      { text: "Keep going", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => timer.discard(),
      },
    ]);
  };

  // The hook works in plain dates so journal entries can share it.
  const loggedDates = useMemo(
    () =>
      activities
        .map((a) => a.date?.toDate?.())
        .filter((d): d is Date => !!d),
    [activities],
  );
  const progress = useMonthlyProgress(loggedDates);

  // Minutes prayed in the month being viewed, from sessions that recorded one.
  const minutesThisMonth = useMemo(() => {
    const { year, month } = progress.view;
    return activities.reduce((total, a) => {
      const d = a.date?.toDate?.();
      if (!d || d.getFullYear() !== year || d.getMonth() !== month) return total;
      return total + (a.durationMinutes ?? 0);
    }, 0);
  }, [activities, progress.view]);
  const { todayLogged } = progress;

  /**
   * Log today's prayer with no text. A prayer activity is what marks the day
   * complete, so this and saving a written prayer are two routes to the same
   * outcome — the user shouldn't have to write something to keep their streak.
   */
  const markTodayDone = async () => {
    if (!user?.uid || marking || todayLogged) return;
    setMarking(true);
    try {
      await addActivity(user.uid, { type: "prayer" });
      await reloadPrayerData();
      showToast("Marked as prayed today 🙏");
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setMarking(false);
    }
  };

  const openPicker = () => {
    setPickerValue(timeToDate(reminderTime));
    setPickerOpen(true);
  };

  const persistReminder = async (date: Date) => {
    if (!user?.uid) return;
    const newTime = dateToTime(date);
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
          <ChevronLeft size={24} color={colors.primary} />
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

          {/* Prayer timer. Keeps running with the app closed or the phone
              locked, so it can be started and simply prayed. */}
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Timer size={16} color={colors.primary} />
              <Text style={styles.timerLabel}>PRAYER TIMER</Text>
            </View>

            {timer.startedAt !== null ? (
              <>
                <Text style={styles.timerValue}>
                  {formatStopwatch(timer.elapsedSeconds)}
                </Text>
                <Text style={styles.timerHint}>
                  Lock your phone if you like — the time keeps counting.
                </Text>
                <View style={styles.timerActions}>
                  <Pressable
                    onPress={stopAndLog}
                    style={({ pressed }) => [
                      styles.timerStop,
                      pressed && styles.markButtonPressed,
                    ]}
                  >
                    <Square size={18} color={colors.white} />
                    <Text style={styles.timerStopText}>Stop &amp; Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmDiscard}
                    style={({ pressed }) => [
                      styles.timerDiscard,
                      pressed && styles.dim,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Discard session"
                  >
                    <X size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.timerIdle}>
                  {minutesThisMonth > 0
                    ? `${formatDuration(minutesThisMonth)} prayed this month`
                    : "Time your prayer and it counts toward today"}
                </Text>
                <Pressable
                  onPress={timer.start}
                  disabled={!timer.ready}
                  style={({ pressed }) => [
                    styles.timerStart,
                    pressed && styles.markButtonPressed,
                    !timer.ready && styles.dim,
                  ]}
                >
                  <Play size={18} color={colors.white} />
                  <Text style={styles.timerStopText}>Start Praying</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Today's prayer: mark it done outright, or write one */}
          {todayLogged ? (
            <View style={[styles.markButton, styles.markButtonDone]}>
              <CheckCircle2 size={22} color={colors.success} />
              <Text style={[styles.markButtonText, styles.markButtonDoneText]}>
                Prayed Today
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={markTodayDone}
              disabled={marking}
              style={({ pressed }) => [
                styles.markButton,
                pressed && styles.markButtonPressed,
                marking && styles.markButtonBusy,
              ]}
            >
              {marking ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Check size={22} color={colors.white} />
                  <Text style={styles.markButtonText}>Mark Today as Done</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={() => navigation.navigate("AddPrayer")}
            style={({ pressed }) => [
              styles.addPrayerBtn,
              pressed && styles.editBtnPressed,
            ]}
          >
            <Plus size={18} color={colors.primary} />
            <Text style={styles.addPrayerText}>Add a Prayer</Text>
          </Pressable>

          <Text style={styles.markHint}>
            {todayLogged
              ? "Today already counts. Add a prayer any time you want to keep one."
              : "Writing a prayer marks today done too — either one counts."}
          </Text>

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

          <MonthlyStats
            progress={progress}
            stats={stats}
            extra={[
              {
                value: formatDuration(minutesThisMonth),
                label: "Time Prayed",
                color: colors.primary,
              },
            ]}
          />

          {/* History Calendar */}
          <MonthCalendar progress={progress} completedLabel="Prayed" />
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
                // See ProfileScreen: pinned light so the wheel text stays dark.
                themeVariant="light"
                textColor={colors.textPrimary}
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
  timerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    ...shadows.sm,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timerLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
  },
  timerValue: {
    fontFamily: fontFamilies.serif,
    fontSize: 48,
    fontWeight: "700",
    color: colors.textPrimary,
    // Keeps the digits from nudging the layout as they change width.
    fontVariant: ["tabular-nums"],
  },
  timerHint: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  timerIdle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  timerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    alignSelf: "stretch",
  },
  timerStart: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    alignSelf: "stretch",
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  timerStop: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  timerStopText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  timerDiscard: {
    width: 52,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dim: {
    opacity: 0.6,
  },
  markButtonDone: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    shadowOpacity: 0,
    elevation: 0,
  },
  markButtonDoneText: {
    color: colors.success,
  },
  markButtonBusy: {
    opacity: 0.7,
  },
  addPrayerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight30,
  },
  addPrayerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
  markHint: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    lineHeight: 16,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Calendar

  // Legend

  // Loading / states
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markButtonDisabled: {
    opacity: 0.6,
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
