import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import { Image } from "expo-image";
import {
  Bell,
  Heart,
  BookOpen,
  PenLine,
  ChevronRight,
  Calendar,
  BookOpenText,
} from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import { ProgressCard } from "../components/dashboard/ProgressCard";
import { TaskCard } from "../components/dashboard/TaskCard";
import { StatCard } from "../components/dashboard/StatCard";
import type { RootStackParamList } from "../navigation/types";

const AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA37M7Idq13PCJDUNLNDCGEiAfVLUCGLlYLiXaAYfDWjUNnKkWp-VoRHPzgFyM7SnyJpudymw5AjDT1SpTyF1nSkSvR8kwUhFffCd5rRm-M1mcHzxJ9w75HHlHGqsnz7kunJDfCprKVaM_1gtPN_LZQa3TySzZednpBLWKAG2fWln15kAr4uVQ0Nemmj-7qhtXwWB4ugdVozw_fc_Fi3bOp5NRpquYqdkulApO4rGvFGVpdUUpUpnPqULHr3c6MkP_uP5lUO5Szk35f";

const TASKS = [
  {
    id: "prayer",
    title: "Prayer",
    subtitle: '"Be still and know..."',
    status: "done" as const,
    iconColor: colors.primary,
  },
  {
    id: "bible",
    title: "Bible Reading",
    subtitle: "Next: Psalms 23",
    status: "active" as const,
    iconColor: colors.white,
  },
  {
    id: "confession",
    title: "Confession",
    subtitle: "Heart alignment",
    status: "done" as const,
    iconColor: colors.primary,
  },
  {
    id: "journal",
    title: "Journal",
    subtitle: "Morning reflection",
    status: "done" as const,
    iconColor: colors.primary,
  },
];

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

export function HomeDashboard() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 500 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: AVATAR_URL }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.greeting}>Peace be with you</Text>
              <Text style={styles.userName}>Good Morning, David</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.notifButton,
              pressed && styles.notifButtonPressed,
            ]}
          >
            <Bell size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Progress Card */}
        <ProgressCard percentage={75} completed={3} total={4} streakDays={12} />

        {/* Daily Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Tasks</Text>
            <Pressable>
              <Text style={styles.editButton}>Edit Tasks</Text>
            </Pressable>
          </View>
          <View style={styles.taskList}>
            {TASKS.map((task) => (
              <TaskCard
                key={task.id}
                icon={getTaskIcon(task.id, task.iconColor)}
                title={task.title}
                subtitle={task.subtitle}
                status={task.status}
                onStart={() => {}}
              />
            ))}
          </View>
        </View>

        {/* Monthly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Calendar size={22} color={colors.primary} />}
              value={12}
              label="Prayer Days"
              onPress={() => navigation.navigate("PrayerTracker")}
            />
            <StatCard
              icon={<BookOpenText size={22} color={colors.primary} />}
              value={10}
              label="Bible Readings"
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.insightsButton,
              pressed && styles.insightsButtonPressed,
            ]}
          >
            <Text style={styles.insightsButtonText}>View Full Insights</Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>
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
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...shadows.sm,
  },
  notifButtonPressed: {
    backgroundColor: colors.primaryLight,
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
  editButton: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  taskList: {
    gap: spacing.lg,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: spacing.lg,
  },

  // Insights button
  insightsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  insightsButtonPressed: {
    backgroundColor: colors.primaryLight05,
  },
  insightsButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
});
