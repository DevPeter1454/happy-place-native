import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { MotiView } from "moti";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  User,
  PenTool,
  Flower,
  PartyPopper,
  ExternalLink,
} from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
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
  getRetreat,
  computeRetreatDays,
  setRetreatTask,
  setRetreatScripture,
  completeRetreat,
} from "../services/retreat.service";
import { getDailyPassageRef } from "../services/bible.service";
import { retreatDayContent } from "../constants/retreatPlans";
import { parsePassageRef } from "../constants/bibleBooks";
import { BookChapterPicker } from "../components/bible/BookChapterPicker";
import type { Retreat, RetreatTaskKey } from "../types/models";

const TASK_META: { key: RetreatTaskKey; title: string; icon: typeof BookOpen }[] =
  [
    { key: "bible", title: "Bible Reading", icon: BookOpen },
    { key: "prayer", title: "Prayer", icon: User },
    { key: "journal", title: "Journaling", icon: PenTool },
    { key: "confession", title: "Confession", icon: Flower },
  ];

export function RetreatDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [retreat, setRetreat] = useState<Retreat | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [initializedDay, setInitializedDay] = useState(false);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setRetreat(null);
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      getRetreat(user.uid)
        .then((r) => {
          if (!active) return;
          setRetreat(r);
          if (r && !initializedDay) {
            const today = computeRetreatDays(r).find((d) => d.isToday);
            setSelectedDay(today ? today.dayIndex : 1);
            setInitializedDay(true);
          }
        })
        .catch(() => active && setRetreat(null))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user?.uid, initializedDay]),
  );

  const days = useMemo(
    () => (retreat ? computeRetreatDays(retreat) : []),
    [retreat],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!retreat) {
    return (
      <View style={styles.container}>
        <View
          style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Retreat</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>No active retreat.</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.dim]}
          >
            <Text style={styles.primaryBtnText}>Set One Up</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const dayProgress = days[selectedDay - 1];
  const content = retreatDayContent(retreat.planId, selectedDay);
  const chosenRef = dayProgress
    ? retreat.scriptures?.[dayProgress.dateKey]
    : undefined;
  const bibleRef = chosenRef ?? content?.passage ?? getDailyPassageRef();

  const totalCells = retreat.totalDays * 4;
  const doneCells = days.reduce(
    (sum, d) => sum + Object.values(d.tasks).filter(Boolean).length,
    0,
  );
  const pct = totalCells ? Math.round((doneCells / totalCells) * 100) : 0;
  const allComplete = totalCells > 0 && doneCells === totalCells;
  const dayDone = dayProgress
    ? Object.values(dayProgress.tasks).filter(Boolean).length
    : 0;

  // Ring math
  const size = 80;
  const strokeWidth = 6;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * pct) / 100;

  // Toggle a retreat task's completion — stored on the retreat only, separate
  // from the global streak/activities.
  const toggleTask = (key: RetreatTaskKey) => {
    if (!retreat || !user?.uid || !dayProgress) return;
    if (dayProgress.isFuture) {
      showToast("You can't complete a future day yet");
      return;
    }
    const dk = dayProgress.dateKey;
    const next = !dayProgress.tasks[key];
    const apply = (val: boolean) =>
      setRetreat((prev) =>
        prev
          ? {
              ...prev,
              progress: {
                ...(prev.progress ?? {}),
                [dk]: { ...(prev.progress?.[dk] ?? {}), [key]: val },
              },
            }
          : prev,
      );
    apply(next);
    setRetreatTask(user.uid, dk, key, next).catch(() => apply(!next));
  };

  // Optional: jump to the matching feature to actually do the discipline. This
  // is just navigation; it does not mark the retreat task.
  const openFeature = (key: RetreatTaskKey) => {
    switch (key) {
      case "bible":
        navigation.navigate("Main", {
          screen: "Bible",
          params: { ref: bibleRef },
        });
        break;
      case "prayer":
        navigation.navigate("PrayerTracker");
        break;
      case "journal":
        navigation.navigate("NewJournalEntry");
        break;
      case "confession":
        navigation.navigate("AddConfession");
        break;
    }
  };

  const chooseScripture = (bookName: string, chapterNum: number) => {
    setBookPickerOpen(false);
    if (!user?.uid || !dayProgress) return;
    const ref = `${bookName} ${chapterNum}`;
    const dk = dayProgress.dateKey;
    setRetreat((prev) =>
      prev
        ? { ...prev, scriptures: { ...(prev.scriptures ?? {}), [dk]: ref } }
        : prev,
    );
    setRetreatScripture(user.uid, dk, ref).catch(() => {});
  };

  const handleComplete = async () => {
    if (completing || !user?.uid) return;
    setCompleting(true);
    try {
      await completeRetreat(user.uid);
      showToast("Retreat complete 🎉");
      navigation.goBack();
    } catch {
      setCompleting(false);
    }
  };

  const taskSubtitle = (key: RetreatTaskKey): string => {
    switch (key) {
      case "bible":
        return `Read ${bibleRef}`;
      case "prayer":
        return "Pray & be still";
      case "journal":
        return content ? "Reflect on today's prompt" : "Write a reflection";
      case "confession":
        return "Quiet contemplation";
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{retreat.title}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          {/* Day navigation */}
          <View style={styles.dayNav}>
            <Pressable
              onPress={() => setSelectedDay((d) => Math.max(1, d - 1))}
              hitSlop={8}
              disabled={selectedDay <= 1}
              style={({ pressed }) => [styles.dayNavBtn, pressed && styles.dim]}
            >
              <ChevronLeft
                size={22}
                color={selectedDay <= 1 ? colors.primaryLight30 : colors.primary}
              />
            </Pressable>
            <View style={styles.dayNavCenter}>
              <Text style={styles.dayNavTitle}>
                Day {selectedDay} of {retreat.totalDays}
              </Text>
              {content ? (
                <Text style={styles.dayNavTheme}>{content.theme}</Text>
              ) : dayProgress?.isToday ? (
                <Text style={styles.dayNavTheme}>Today</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() =>
                setSelectedDay((d) => Math.min(retreat.totalDays, d + 1))
              }
              hitSlop={8}
              disabled={selectedDay >= retreat.totalDays}
              style={({ pressed }) => [styles.dayNavBtn, pressed && styles.dim]}
            >
              <ChevronRight
                size={22}
                color={
                  selectedDay >= retreat.totalDays
                    ? colors.primaryLight30
                    : colors.primary
                }
              />
            </Pressable>
          </View>

          {/* Hero verse */}
          <View style={styles.heroSection}>
            <Text style={styles.heroQuote}>
              &ldquo;{content?.verse ?? "Be still, and know that I am God."}
              &rdquo;
            </Text>
            {content ? null : (
              <Text style={styles.heroVerse}>— Psalm 46:10</Text>
            )}
          </View>

          {/* Progress ring */}
          <View style={styles.progressCard}>
            <View style={styles.progressCircleContainer}>
              <Svg
                width={size}
                height={size}
                style={{ transform: [{ rotate: "-90deg" }] }}
              >
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={colors.primaryLight05}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={colors.primary}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressPercentageText}>{pct}%</Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Retreat Progress</Text>
              <Text style={styles.progressSubtitle}>
                {dayProgress?.isFuture
                  ? "Upcoming day — check back then."
                  : `${dayDone} of 4 tasks done this day.`}
              </Text>
            </View>
          </View>

          {/* Scripture (pick your own) */}
          <View style={styles.scriptureCard}>
            <View style={styles.scriptureInfo}>
              <Text style={styles.scriptureLabel}>SCRIPTURE</Text>
              <Text style={styles.scriptureRef}>{bibleRef}</Text>
            </View>
            <Pressable
              onPress={() => setBookPickerOpen(true)}
              style={({ pressed }) => [styles.scriptureChange, pressed && styles.dim]}
            >
              <Text style={styles.scriptureChangeText}>Change</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                navigation.navigate("Main", {
                  screen: "Bible",
                  params: { ref: bibleRef },
                })
              }
              style={({ pressed }) => [styles.scriptureOpen, pressed && styles.dim]}
            >
              <BookOpen size={18} color={colors.white} />
            </Pressable>
          </View>

          {/* Reflection prompt (guided) */}
          {content ? (
            <View style={styles.reflectCard}>
              <Text style={styles.reflectLabel}>REFLECTION</Text>
              <Text style={styles.reflectText}>{content.prompt}</Text>
            </View>
          ) : null}

          {/* Tasks */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>Daily Spiritual Tasks</Text>
              <Text style={styles.tasksSubtitle}>
                {dayProgress?.isToday ? "TODAY" : `DAY ${selectedDay}`}
              </Text>
            </View>

            <View style={styles.tasksList}>
              {TASK_META.map(({ key, title, icon: Icon }) => {
                const done = !!dayProgress?.tasks[key];
                return (
                  <Pressable
                    key={key}
                    style={styles.taskCard}
                    onPress={() => toggleTask(key)}
                  >
                    <View style={styles.taskLeft}>
                      <View
                        style={[
                          styles.taskIconContainer,
                          !done && styles.taskIconContainerPending,
                        ]}
                      >
                        <Icon
                          size={20}
                          color={done ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.taskText}>
                        <Text style={styles.taskTitle}>{title}</Text>
                        <Text style={styles.taskSubtitle}>
                          {taskSubtitle(key)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.taskRight}>
                      <Pressable
                        onPress={() => openFeature(key)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.openBtn,
                          pressed && styles.dim,
                        ]}
                      >
                        <ExternalLink size={16} color={colors.textMuted} />
                      </Pressable>
                      <View
                        style={[
                          styles.checkbox,
                          done && styles.checkboxCompleted,
                        ]}
                      >
                        {done ? (
                          <Check size={14} color={colors.white} strokeWidth={3} />
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.tasksHint}>
              Tap a task to check it off · tap{" "}
              <Text style={{ color: colors.textSecondary }}>↗</Text> to open it in
              the app
            </Text>
          </View>

          {/* Complete */}
          {allComplete ? (
            <Pressable
              onPress={handleComplete}
              disabled={completing}
              style={({ pressed }) => [styles.completeBtn, pressed && styles.dim]}
            >
              <PartyPopper size={20} color={colors.white} />
              <Text style={styles.completeText}>
                {completing ? "Finishing…" : "Complete Retreat"}
              </Text>
            </Pressable>
          ) : null}
        </MotiView>
      </ScrollView>

      <BookChapterPicker
        visible={bookPickerOpen}
        currentBook={parsePassageRef(bibleRef)?.book ?? null}
        onClose={() => setBookPickerOpen(false)}
        onSelect={chooseScripture}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: { padding: spacing.xs, width: 40 },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerRight: { width: 40 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  emptyText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
  },
  primaryBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  dim: { opacity: 0.6 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg },

  dayNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  dayNavBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNavCenter: { flex: 1, alignItems: "center" },
  dayNavTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dayNavTheme: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },

  heroSection: { paddingVertical: spacing.md, alignItems: "center" },
  heroQuote: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontWeight: "500",
    fontStyle: "italic",
    color: colors.primary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  heroVerse: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  progressCircleContainer: {
    width: 80,
    height: 80,
    marginRight: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  progressTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentageText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  progressInfo: { flex: 1 },
  progressTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  scriptureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  scriptureInfo: { flex: 1 },
  scriptureLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  scriptureRef: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scriptureChange: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
  },
  scriptureChangeText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  scriptureOpen: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  reflectCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  reflectLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  reflectText: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    lineHeight: 24,
  },

  tasksSection: { marginBottom: spacing.xl },
  tasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  tasksTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tasksSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tasksList: { gap: spacing.sm },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.05)",
    ...shadows.sm,
  },
  taskLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  taskText: { flex: 1 },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: "rgba(138, 110, 71, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  taskIconContainerPending: { backgroundColor: colors.background },
  taskTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  taskSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  taskRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  openBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tasksHint: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },

  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    marginTop: spacing.sm,
    ...shadows.lg,
    shadowColor: colors.primary,
  },
  completeText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
});
