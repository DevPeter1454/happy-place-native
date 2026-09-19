import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import {
  ChevronLeft,
  ChevronRight,
  PenLine,
  Plus,
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
import { listEntries } from "../services/journal.service";
import { getStats } from "../services/activities.service";
import { cacheKeys } from "../services/cache";
import { useCachedData } from "../hooks/useCachedData";
import { useMonthlyProgress } from "../hooks/useMonthlyProgress";
import { MonthlyStats } from "../components/tracker/MonthlyStats";
import { MonthCalendar } from "../components/tracker/MonthCalendar";
import { journalDetailParams } from "../utils/journal";
import type { RootStackScreenProps } from "../navigation/types";

/**
 * Journalling history and monthly stats, matching the prayer, Bible and
 * confession trackers.
 *
 * Journal entries live in their own collection and date from `createdAt` rather
 * than an activity's `date`, which is why `useMonthlyProgress` works in plain
 * dates — the calendar maths is identical either way.
 */
export function JournalTrackerScreen({
  navigation,
}: RootStackScreenProps<"JournalTracker">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const uid = user?.uid;
  const { data, loading } = useCachedData(
    uid ? cacheKeys.journalTracker(uid) : null,
    async () => {
      const [entries, stats] = await Promise.all([
        listEntries(uid!),
        getStats(uid!),
      ]);
      return { entries, stats };
    },
  );
  const entries = data?.entries ?? [];
  const stats = data?.stats ?? null;

  const loggedDates = useMemo(
    () =>
      entries
        .map((e) => e.createdAt?.toDate?.())
        .filter((d): d is Date => !!d),
    [entries],
  );
  const progress = useMonthlyProgress(loggedDates);

  const latest = entries.length ? entries[0] : null;

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
        <Text style={styles.headerTitle}>Reflections</Text>
        <Pressable
          onPress={() => navigation.navigate("NewJournalEntry")}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && styles.headerBtnPressed,
          ]}
        >
          <Plus size={22} color={colors.primary} />
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
          {latest ? (
            <Pressable
              onPress={() =>
                navigation.navigate(
                  "JournalEntryDetail",
                  journalDetailParams(latest),
                )
              }
              style={({ pressed }) => [
                styles.latestCard,
                pressed && styles.dim,
              ]}
            >
              <View style={styles.latestHeader}>
                <PenLine size={16} color={colors.primary} />
                <Text style={styles.latestLabel}>LATEST REFLECTION</Text>
              </View>
              {latest.title?.trim() ? (
                <Text style={styles.latestTitle}>{latest.title.trim()}</Text>
              ) : null}
              <Text style={styles.latestText} numberOfLines={4}>
                {latest.body}
              </Text>
              <View style={styles.latestCta}>
                <Text style={styles.latestCtaText}>Read reflection</Text>
                <ChevronRight size={14} color={colors.primary} />
              </View>
            </Pressable>
          ) : null}

          {progress.todayLogged ? null : (
            <Pressable
              onPress={() => navigation.navigate("NewJournalEntry")}
              style={({ pressed }) => [
                styles.markButton,
                pressed && styles.markButtonPressed,
              ]}
            >
              <Plus size={22} color={colors.white} />
              <Text style={styles.markButtonText}>Write Today's Reflection</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => navigation.navigate("Main", { screen: "Journal" })}
            style={({ pressed }) => [styles.listBtn, pressed && styles.dim]}
          >
            <PenLine size={18} color={colors.primary} />
            <Text style={styles.listBtnText}>All Reflections</Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>

          <MonthlyStats progress={progress} stats={stats} />
          <MonthCalendar progress={progress} completedLabel="Journalled" />
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
  latestCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  latestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  latestLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
  },
  latestTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  latestText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  latestCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: spacing.xs,
  },
  latestCtaText: {
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
    ...shadows.lg,
  },
  markButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  markButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  listBtn: {
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
  listBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
  dim: {
    opacity: 0.7,
  },
});
