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
  Quote,
  Plus,
  ScrollText,
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
import { listActivities, getStats } from "../services/activities.service";
import { cacheKeys } from "../services/cache";
import { useCachedData } from "../hooks/useCachedData";
import { useMonthlyProgress } from "../hooks/useMonthlyProgress";
import { MonthlyStats } from "../components/tracker/MonthlyStats";
import { MonthCalendar } from "../components/tracker/MonthCalendar";
import { parseConfession } from "../utils/confessions";
import type { RootStackScreenProps } from "../navigation/types";

/**
 * Confession history and monthly stats — the counterpart to the prayer and Bible
 * trackers, built from the same stats/calendar components.
 */
export function ConfessionTrackerScreen({
  navigation,
}: RootStackScreenProps<"ConfessionTracker">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const uid = user?.uid;
  const { data, loading } = useCachedData(
    uid ? cacheKeys.confessionTracker(uid) : null,
    async () => {
      const [activities, stats] = await Promise.all([
        listActivities(uid!, "confession"),
        getStats(uid!),
      ]);
      return { activities, stats };
    },
  );
  const activities = data?.activities ?? [];
  const stats = data?.stats ?? null;

  const loggedDates = useMemo(
    () =>
      activities.map((a) => a.date?.toDate?.()).filter((d): d is Date => !!d),
    [activities],
  );
  const progress = useMonthlyProgress(loggedDates);

  const latest = activities.length ? parseConfession(activities[0]) : null;

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
        <Text style={styles.headerTitle}>Confessions</Text>
        <Pressable
          onPress={() => navigation.navigate("AddConfession")}
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
                navigation.navigate("ConfessionList", {
                  highlightId: latest.id,
                })
              }
              style={({ pressed }) => [
                styles.latestCard,
                pressed && styles.dim,
              ]}
            >
              <View style={styles.latestHeader}>
                <Quote size={16} color={colors.primary} />
                <Text style={styles.latestLabel}>LATEST CONFESSION</Text>
              </View>
              <Text style={styles.latestText} numberOfLines={4}>
                "{latest.text}"
              </Text>
              {latest.verse ? (
                <Text style={styles.latestVerse}>— {latest.verse}</Text>
              ) : null}
              <View style={styles.latestCta}>
                <Text style={styles.latestCtaText}>Open confession</Text>
                <ChevronRight size={14} color={colors.primary} />
              </View>
            </Pressable>
          ) : null}

          {progress.todayLogged ? null : (
            <Pressable
              onPress={() => navigation.navigate("AddConfession")}
              style={({ pressed }) => [
                styles.markButton,
                pressed && styles.markButtonPressed,
              ]}
            >
              <Plus size={22} color={colors.white} />
              <Text style={styles.markButtonText}>Add a Confession</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => navigation.navigate("ConfessionList")}
            style={({ pressed }) => [styles.listBtn, pressed && styles.dim]}
          >
            <ScrollText size={18} color={colors.primary} />
            <Text style={styles.listBtnText}>All Confessions</Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>

          <MonthlyStats progress={progress} stats={stats} />
          <MonthCalendar progress={progress} completedLabel="Confessed" />
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
  latestText: {
    fontFamily: fontFamilies.serifItalic,
    fontSize: fontSizes.lg,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  latestVerse: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
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
