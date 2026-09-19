import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import {
  ChevronLeft,
  BookOpen,
  BookOpenText,
  Check,
  CheckCircle2,
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
import { getDailyPassageRef } from "../services/bible.service";
import { cacheKeys } from "../services/cache";
import { useCachedData } from "../hooks/useCachedData";
import { MonthlyStats } from "../components/tracker/MonthlyStats";
import { MonthCalendar } from "../components/tracker/MonthCalendar";
import { useMonthlyProgress } from "../hooks/useMonthlyProgress";
import type { RootStackScreenProps } from "../navigation/types";

/** "YYYY-MM-DD" for a day of the viewed month — the VerseOfDay route's param. */
function dayParam(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * Reading history and monthly stats for Bible reading — the counterpart to the
 * prayer tracker, sharing its stats/calendar components so the two read the same.
 *
 * Tapping any past day opens the verse that was the verse of the day then; the
 * reading plan is derived from the calendar date, so history is reconstructable.
 */
export function BibleTrackerScreen({
  navigation,
}: RootStackScreenProps<"BibleTracker">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [marking, setMarking] = useState(false);

  const todayPassage = getDailyPassageRef();

  const uid = user?.uid;
  const { data, loading, refresh: reload } = useCachedData(
    uid ? cacheKeys.bibleTracker(uid) : null,
    async () => {
      const [activities, stats] = await Promise.all([
        listActivities(uid!, "bible_reading"),
        getStats(uid!),
      ]);
      return { activities, stats };
    },
  );
  const activities = data?.activities ?? [];
  const stats = data?.stats ?? null;

  // The hook works in plain dates so journal entries can share it.
  const loggedDates = useMemo(
    () =>
      activities
        .map((a) => a.date?.toDate?.())
        .filter((d): d is Date => !!d),
    [activities],
  );
  const progress = useMonthlyProgress(loggedDates);
  const { todayLogged } = progress;

  /** Log today's reading. Mirrors the reader's own "Mark as Read". */
  const markTodayRead = async () => {
    if (!user?.uid || marking || todayLogged) return;
    setMarking(true);
    try {
      await addActivity(user.uid, {
        type: "bible_reading",
        notes: todayPassage,
      });
      await reload();
      showToast("Marked as read 📖");
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setMarking(false);
    }
  };

  const openDay = (day: number) => {
    navigation.navigate("VerseOfDay", {
      date: dayParam(progress.view.year, progress.view.month, day),
    });
  };

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 400 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
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
        <Text style={styles.headerTitle}>Reading Tracker</Text>
        <Pressable
          onPress={() => navigation.navigate("Main", { screen: "Bible" })}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && styles.headerBtnPressed,
          ]}
        >
          <BookOpen size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Today's passage */}
          <View style={styles.todayCard}>
            <View style={styles.todayLeft}>
              <View style={styles.todayIcon}>
                <BookOpenText size={22} color={colors.primary} />
              </View>
              <View style={styles.todayText}>
                <Text style={styles.todayLabel}>Today's Reading</Text>
                <Text style={styles.todayPassage}>{todayPassage}</Text>
              </View>
            </View>
            <Pressable
              onPress={() =>
                navigation.navigate("Main", {
                  screen: "Bible",
                  params: { ref: todayPassage },
                })
              }
              style={({ pressed }) => [styles.openBtn, pressed && styles.dim]}
            >
              <Text style={styles.openBtnText}>Open</Text>
            </Pressable>
          </View>

          {todayLogged ? (
            <View style={[styles.markButton, styles.markButtonDone]}>
              <CheckCircle2 size={22} color={colors.success} />
              <Text style={[styles.markButtonText, styles.markButtonDoneText]}>
                Read Today
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={markTodayRead}
              disabled={marking}
              style={({ pressed }) => [
                styles.markButton,
                pressed && styles.markButtonPressed,
                marking && styles.dim,
              ]}
            >
              {marking ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Check size={22} color={colors.white} />
                  <Text style={styles.markButtonText}>Mark Today as Read</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={() => navigation.navigate("VerseOfDay")}
            style={({ pressed }) => [styles.votdBtn, pressed && styles.dim]}
          >
            <BookOpenText size={18} color={colors.primary} />
            <Text style={styles.votdBtnText}>Today's Verse of the Day</Text>
          </Pressable>

          <MonthlyStats progress={progress} stats={stats} />

          <MonthCalendar
            progress={progress}
            completedLabel="Read"
            onSelectDay={openDay}
          />
        </ScrollView>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnPressed: {
    backgroundColor: colors.primaryLight,
  },
  headerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  todayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  todayIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: {
    flex: 1,
  },
  todayLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  todayPassage: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  openBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
  },
  openBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  markButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    marginTop: -spacing.sm,
    ...shadows.lg,
  },
  markButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  markButtonDone: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    shadowOpacity: 0,
    elevation: 0,
  },
  markButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  markButtonDoneText: {
    color: colors.success,
  },
  votdBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: -spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight30,
  },
  votdBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
  dim: {
    opacity: 0.7,
  },
});
