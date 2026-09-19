import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import {
  Heart,
  HandHeart,
  Quote,
  BookOpen,
  PenLine,
  Calendar,
  BookOpenText,
  ChevronRight,
  Plus,
} from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing, radii } from "../theme";
import { ProgressCard } from "../components/dashboard/ProgressCard";
import { TaskCard } from "../components/dashboard/TaskCard";
import { StatCard } from "../components/dashboard/StatCard";
import { Avatar } from "../components/profile/Avatar";
import { cacheKeys } from "../services/cache";
import { useCachedData } from "../hooks/useCachedData";
import { parseConfession, type ParsedConfession } from "../utils/confessions";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { useTabBarVisibility } from "../context/TabBarContext";
import { getStats, listActivities } from "../services/activities.service";
import { listEntries } from "../services/journal.service";
import { getDailyReading } from "../services/bible.service";
import type { ActivityType, DailyReading } from "../types/models";

/** Identifiers for the four daily disciplines shown on the dashboard. */
type TaskId = "prayer" | "bible" | "confession" | "journal";

/**
 * Static definitions for the daily disciplines. Their `status` is derived at
 * runtime from today's logged activities/journal entries — only the labels and
 * the screen each one links to are fixed here.
 */
const TASKS: {
  id: TaskId;
  title: string;
  subtitle: string;
  /** The activity type that marks this task done, or "journal" for entries. */
  source: ActivityType | "journal";
}[] = [
  {
    id: "prayer",
    title: "Prayer",
    subtitle: '"Be still and know..."',
    source: "prayer",
  },
  {
    id: "bible",
    title: "Bible Reading",
    subtitle: "Next: Psalms 23",
    source: "bible_reading",
  },
  {
    id: "confession",
    title: "Confession",
    subtitle: "Heart alignment",
    source: "confession",
  },
  {
    id: "journal",
    title: "Journal",
    subtitle: "Morning reflection",
    source: "journal",
  },
];

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Local YYYY-MM-DD key for a date — mirrors the helper in activities.service. */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** One distinct icon per discipline — prayer and confession shared Heart. */
function getTaskIcon(id: string, iconColor: string) {
  const size = 24;
  switch (id) {
    case "prayer":
      return <HandHeart size={size} color={iconColor} />;
    case "bible":
      return <BookOpen size={size} color={iconColor} />;
    case "confession":
      return <Quote size={size} color={iconColor} />;
    case "journal":
      return <PenLine size={size} color={iconColor} />;
    default:
      return <Heart size={size} color={iconColor} />;
  }
}

/**
 * Which TaskCard ids are completed today, this month's figures, and the streak.
 *
 * The monthly figures are counted from the fetched activities/entries rather
 * than read from `stats.totalsByType` — those are lifetime counters that never
 * reset, so using them under a "Monthly Summary" heading reported the wrong
 * number. Each figure matches the wording of its label: prayer counts distinct
 * days, the rest count entries.
 */
interface DashboardData {
  doneToday: Record<TaskId, boolean>;
  monthly: {
    prayerDays: number;
    bibleReadings: number;
    confessions: number;
    reflections: number;
  };
  streakDays: number;
  /** Newest confession(s), for the dashboard preview. */
  recentConfessions: ParsedConfession[];
}

const EMPTY_DATA: DashboardData = {
  doneToday: { prayer: false, bible: false, confession: false, journal: false },
  monthly: {
    prayerDays: 0,
    bibleReadings: 0,
    confessions: 0,
    reflections: 0,
  },
  streakDays: 0,
  recentConfessions: [],
};

/** How many confessions the dashboard previews before "See all". */
const CONFESSION_PREVIEW = 1;

export function HomeDashboard() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, user } = useAuth();
  const { onScroll } = useTabBarVisibility();
  const fullName = profile?.fullName ?? user?.displayName ?? "";
  const firstName = fullName.trim().split(" ")[0] || "Friend";
  // Same precedence as the Profile screen, so the two never disagree; with no
  // picture <Avatar> falls back to the user's initials.
  const avatarUrl = profile?.photoURL ?? user?.photoURL ?? null;

  const [reading, setReading] = useState<DailyReading | null>(null);

  // The daily reading is the same for everyone and doesn't need auth, so load
  // it independently. It's cached, so this is cheap on repeat focuses.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getDailyReading()
        .then((r) => active && setReading(r))
        .catch(() => active && setReading(null));
      return () => {
        active = false;
      };
    }, [])
  );

  const uid = user?.uid;
  const loadData = useCallback(async (): Promise<DashboardData> => {
    const todayKey = dateKey(new Date());
    const [activities, entries, stats] = await Promise.all([
      listActivities(uid!),
      listEntries(uid!),
      getStats(uid!),
    ]);

    const doneToday: Record<TaskId, boolean> = {
      prayer: false,
      bible: false,
      confession: false,
      journal: false,
    };
    for (const a of activities) {
      if (dateKey(a.date.toDate()) !== todayKey) continue;
      if (a.type === "prayer") doneToday.prayer = true;
      else if (a.type === "bible_reading") doneToday.bible = true;
      else if (a.type === "confession") doneToday.confession = true;
    }
    doneToday.journal = entries.some(
      (e) => e.createdAt && dateKey(e.createdAt.toDate()) === todayKey
    );

    // This month's figures, counted from the same fetched data — no extra reads.
    const now = new Date();
    const thisMonth = (d: Date) =>
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();

    const prayerDays = new Set<string>();
    let bibleReadings = 0;
    let confessions = 0;
    for (const a of activities) {
      const d = a.date?.toDate?.();
      if (!d || !thisMonth(d)) continue;
      if (a.type === "prayer") prayerDays.add(dateKey(d));
      else if (a.type === "bible_reading") bibleReadings += 1;
      else if (a.type === "confession") confessions += 1;
    }
    const reflections = entries.filter(
      (e) => e.createdAt && thisMonth(e.createdAt.toDate())
    ).length;

    // listActivities(uid) already returns every type newest-first, so the
    // confession preview costs no extra query.
    const recentConfessions = activities
      .filter((a) => a.type === "confession")
      .slice(0, CONFESSION_PREVIEW)
      .map(parseConfession);

    return {
      doneToday,
      monthly: {
        prayerDays: prayerDays.size,
        bibleReadings,
        confessions,
        reflections,
      },
      streakDays: stats?.currentStreak ?? 0,
      recentConfessions,
    };
  }, [uid]);

  const { data: cached } = useCachedData(
    uid ? cacheKeys.dashboard(uid) : null,
    loadData,
  );
  const data = cached ?? EMPTY_DATA;


  const completed = TASKS.filter((t) => data.doneToday[t.id]).length;
  const total = TASKS.length;
  const percentage = Math.round((completed / total) * 100);

  /**
   * Where tapping a discipline goes.
   *
   * Once it's done for the day the destination changes from "log it" to "see
   * it": opening a blank composer for a task you've already completed is the
   * wrong answer. Prayer and Bible already land on screens that read well either
   * way, so only confession and journal need the distinction.
   */
  const openTask = (id: TaskId, isDone: boolean) => {
    switch (id) {
      case "prayer":
        navigation.navigate("PrayerTracker");
        break;
      case "bible":
        navigation.navigate("Main", {
          screen: "Bible",
          params: reading ? { ref: reading.reference } : undefined,
        });
        break;
      case "confession":
        if (isDone) navigation.navigate("ConfessionList");
        else navigation.navigate("AddConfession");
        break;
      case "journal":
        if (isDone) navigation.navigate("Main", { screen: "Journal" });
        else navigation.navigate("NewJournalEntry");
        break;
    }
  };

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 500 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => navigation.navigate("Main", { screen: "Profile" })}
              style={styles.avatarContainer}
            >
              <View style={styles.avatarRing}>
                <Avatar uri={avatarUrl} name={fullName} size={44} />
              </View>
              <View style={styles.onlineDot} />
            </Pressable>
            <View>
              <Text style={styles.greeting}>Peace be with you</Text>
              <Text style={styles.userName}>
                {getTimeBasedGreeting()}, {firstName}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Card */}
        <ProgressCard
          percentage={percentage}
          completed={completed}
          total={total}
          streakDays={data.streakDays}
        />

        {/* Verse of the Day */}
        {reading ? (
          <Pressable
            onPress={() => navigation.navigate("VerseOfDay")}
            style={({ pressed }) => [
              styles.votdCard,
              pressed && styles.votdCardPressed,
            ]}
          >
            <View style={styles.votdHeader}>
              <BookOpenText size={16} color={colors.primary} />
              <Text style={styles.votdLabel}>VERSE OF THE DAY</Text>
            </View>
            <Text style={styles.votdText}>"{reading.votd.text}"</Text>
            <View style={styles.votdFooter}>
              <Text style={styles.votdRef}>— {reading.votd.reference}</Text>
              <ChevronRight size={16} color={colors.primary} />
            </View>
          </Pressable>
        ) : null}

        {/* Daily Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Tasks</Text>
          </View>
          <View style={styles.taskList}>
            {TASKS.map((task) => {
              const isDone = data.doneToday[task.id];
              const status = isDone ? "done" : "active";
              const iconColor = isDone ? colors.primary : colors.white;
              const subtitle =
                task.id === "bible" && reading
                  ? `Today: ${reading.reference}`
                  : task.subtitle;
              return (
                <TaskCard
                  key={task.id}
                  icon={getTaskIcon(task.id, iconColor)}
                  title={task.title}
                  subtitle={subtitle}
                  status={status}
                  onStart={() => openTask(task.id, isDone)}
                />
              );
            })}
          </View>
        </View>

        {/* Confessions — readable here so they aren't buried inside Journal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Confessions</Text>
            <Pressable
              onPress={() => navigation.navigate("ConfessionList")}
              hitSlop={8}
              style={({ pressed }) => [styles.seeAll, pressed && styles.dim]}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={14} color={colors.primary} />
            </Pressable>
          </View>

          {data.recentConfessions.length ? (
            <View style={styles.confessionList}>
              {data.recentConfessions.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() =>
                    navigation.navigate("ConfessionList", {
                      highlightId: c.id,
                    })
                  }
                  style={({ pressed }) => [
                    styles.confessionCard,
                    pressed && styles.dim,
                  ]}
                >
                  <Text style={styles.confessionText} numberOfLines={3}>
                    "{c.text}"
                  </Text>
                  {c.verse ? (
                    <Text style={styles.confessionVerse}>— {c.verse}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              onPress={() => navigation.navigate("AddConfession")}
              style={({ pressed }) => [
                styles.confessionEmpty,
                pressed && styles.dim,
              ]}
            >
              <Text style={styles.confessionEmptyText}>
                Speak life over your day — write your first confession.
              </Text>
              <View style={styles.confessionEmptyCta}>
                <Plus size={16} color={colors.primary} />
                <Text style={styles.seeAllText}>Add a confession</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Monthly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Calendar size={22} color={colors.primary} />}
              value={data.monthly.prayerDays}
              label="Prayer Days"
              onPress={() => navigation.navigate("PrayerTracker")}
            />
            <StatCard
              icon={<BookOpenText size={22} color={colors.primary} />}
              value={data.monthly.bibleReadings}
              label="Bible Readings"
              onPress={() => navigation.navigate("BibleTracker")}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Quote size={22} color={colors.primary} />}
              value={data.monthly.confessions}
              label="Confessions"
              onPress={() => navigation.navigate("ConfessionTracker")}
            />
            <StatCard
              icon={<PenLine size={22} color={colors.primary} />}
              value={data.monthly.reflections}
              label="Reflections"
              onPress={() => navigation.navigate("JournalTracker")}
            />
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
    paddingBottom: 120,
    gap: spacing["2xl"],
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.onlineDot,
    borderWidth: 2,
    borderColor: colors.background,
  },
  greeting: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: colors.primary,
  },
  userName: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 30,
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
  taskList: {
    gap: spacing.lg,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: spacing.lg,
  },

  // Confessions
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  dim: {
    opacity: 0.6,
  },
  confessionList: {
    gap: spacing.md,
  },
  confessionCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGold,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  confessionText: {
    fontFamily: fontFamilies.serifItalic,
    fontSize: fontSizes.base,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  confessionVerse: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  confessionEmpty: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    borderStyle: "dashed",
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  confessionEmptyText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  confessionEmptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  // Verse of the Day
  votdCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    gap: spacing.sm,
  },
  votdCardPressed: {
    opacity: 0.9,
  },
  votdHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  votdLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  votdText: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontStyle: "italic",
    lineHeight: 28,
    color: colors.textPrimary,
  },
  votdFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  votdRef: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
