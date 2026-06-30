import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import { Image } from "expo-image";
import {
  Heart,
  BookOpen,
  PenLine,
  Calendar,
  BookOpenText,
} from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing } from "../theme";
import { ProgressCard } from "../components/dashboard/ProgressCard";
import { TaskCard } from "../components/dashboard/TaskCard";
import { StatCard } from "../components/dashboard/StatCard";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { useTabBarVisibility } from "../context/TabBarContext";
import { getStats, listActivities } from "../services/activities.service";
import { listEntries } from "../services/journal.service";
import { getDailyReading } from "../services/bible.service";
import type { ActivityType, DailyReading } from "../types/models";

/** Avatar used when the profile has no `photoURL` set. */
const FALLBACK_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA37M7Idq13PCJDUNLNDCGEiAfVLUCGLlYLiXaAYfDWjUNnKkWp-VoRHPzgFyM7SnyJpudymw5AjDT1SpTyF1nSkSvR8kwUhFffCd5rRm-M1mcHzxJ9w75HHlHGqsnz7kunJDfCprKVaM_1gtPN_LZQa3TySzZednpBLWKAG2fWln15kAr4uVQ0Nemmj-7qhtXwWB4ugdVozw_fc_Fi3bOp5NRpquYqdkulApO4rGvFGVpdUUpUpnPqULHr3c6MkP_uP5lUO5Szk35f";

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

function getTaskIcon(id: string, iconColor: string) {
  const size = 24;
  switch (id) {
    case "prayer":
      return <Heart size={size} color={iconColor} />;
    case "bible":
      return <BookOpen size={size} color={iconColor} />;
    case "confession":
      return <Heart size={size} color={iconColor} />;
    case "journal":
      return <PenLine size={size} color={iconColor} />;
    default:
      return <Heart size={size} color={iconColor} />;
  }
}

/** Which TaskCard ids are completed today, plus the monthly totals + streak. */
interface DashboardData {
  doneToday: Record<TaskId, boolean>;
  prayerTotal: number;
  bibleTotal: number;
  streakDays: number;
}

const EMPTY_DATA: DashboardData = {
  doneToday: { prayer: false, bible: false, confession: false, journal: false },
  prayerTotal: 0,
  bibleTotal: 0,
  streakDays: 0,
};

export function HomeDashboard() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, user } = useAuth();
  const { onScroll } = useTabBarVisibility();
  const fullName = profile?.fullName ?? user?.displayName ?? "";
  const firstName = fullName.trim().split(" ")[0] || "Friend";
  const avatarUrl = profile?.photoURL ?? FALLBACK_AVATAR_URL;

  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
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

  const loadData = useCallback(async (uid: string) => {
    const todayKey = dateKey(new Date());
    const [activities, entries, stats] = await Promise.all([
      listActivities(uid),
      listEntries(uid),
      getStats(uid),
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

    setData({
      doneToday,
      prayerTotal: stats?.totalsByType.prayer ?? 0,
      bibleTotal: stats?.totalsByType.bible_reading ?? 0,
      streakDays: stats?.currentStreak ?? 0,
    });
  }, []);

  // Reload whenever the screen regains focus, so newly-logged disciplines
  // are reflected when the user navigates back to the dashboard.
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setData(EMPTY_DATA);
        return;
      }
      let active = true;
      loadData(user.uid).catch(() => {
        if (active) setData(EMPTY_DATA);
      });
      return () => {
        active = false;
      };
    }, [user?.uid, loadData])
  );

  const completed = TASKS.filter((t) => data.doneToday[t.id]).length;
  const total = TASKS.length;
  const percentage = Math.round((completed / total) * 100);

  /** Route a discipline's "Start" button to the screen that logs it. */
  const startTask = (id: TaskId) => {
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
        navigation.navigate("AddConfession");
        break;
      case "journal":
        navigation.navigate("NewJournalEntry");
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
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
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
            onPress={() =>
              navigation.navigate("Main", {
                screen: "Bible",
                params: { ref: reading.reference },
              })
            }
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
            <Text style={styles.votdRef}>— {reading.votd.reference}</Text>
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
                  onStart={() => startTask(task.id)}
                />
              );
            })}
          </View>
        </View>

        {/* Monthly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Calendar size={22} color={colors.primary} />}
              value={data.prayerTotal}
              label="Prayer Days"
              onPress={() => navigation.navigate("PrayerTracker")}
            />
            <StatCard
              icon={<BookOpenText size={22} color={colors.primary} />}
              value={data.bibleTotal}
              label="Bible Readings"
              onPress={() => navigation.navigate("Main", { screen: "Bible" })}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primaryLight,
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
  votdRef: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
