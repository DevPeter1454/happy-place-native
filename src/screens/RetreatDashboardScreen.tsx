import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { Image } from "expo-image";
import { MotiView } from "moti";
import {
  ChevronLeft,
  Check,
  BookOpen,
  User,
  PenTool,
  Flower,
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

type Task = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  completed: boolean;
};

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "Bible Reading",
    subtitle: "Morning Devotional",
    icon: <BookOpen size={20} color={colors.primary} />,
    completed: true,
  },
  {
    id: "2",
    title: "Prayer",
    subtitle: "Intercessory & Silent",
    icon: <User size={20} color={colors.primary} />,
    completed: true,
  },
  {
    id: "3",
    title: "Journaling",
    subtitle: "Reflections on Grace",
    icon: <PenTool size={20} color={colors.textSecondary} />,
    completed: false,
  },
  {
    id: "4",
    title: "Confession",
    subtitle: "Quiet Contemplation",
    icon: <Flower size={20} color={colors.textSecondary} />,
    completed: false,
  },
];

export function RetreatDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage =
    Math.round((completedCount / totalCount) * 100) || 0;

  // Circular progress math
  const size = 80;
  const strokeWidth = 6;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * progressPercentage) / 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, spacing.md) },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Happy Place</Text>
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
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Your Retreat</Text>
            <Text style={styles.heroQuote}>
              "Be still, and know that I am God."
            </Text>
            <Text style={styles.heroVerse}>— Psalm 46:10</Text>
          </View>

          {/* Progress Card */}
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
                <Text style={styles.progressPercentageText}>
                  {progressPercentage}%
                </Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Retreat Progress</Text>
              <Text style={styles.progressSubtitle}>
                You're doing great! You have {totalCount - completedCount} tasks
                left for today.
              </Text>
            </View>
          </View>

          {/* Tasks List */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>Daily Spiritual Tasks</Text>
              <Text style={styles.tasksSubtitle}>TODAY</Text>
            </View>

            <View style={styles.tasksList}>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => toggleTask(task.id)}
                >
                  <View style={styles.taskLeft}>
                    <View
                      style={[
                        styles.taskIconContainer,
                        !task.completed && styles.taskIconContainerPending,
                      ]}
                    >
                      {React.cloneElement(
                        task.icon as React.ReactElement<{ color: string }>,
                        {
                          color: task.completed
                            ? colors.primary
                            : colors.textSecondary,
                        },
                      )}
                    </View>
                    <View>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      task.completed && styles.checkboxCompleted,
                    ]}
                  >
                    {task.completed && (
                      <Check size={14} color={colors.white} strokeWidth={3} />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Suggestion Card */}
          <Pressable
            style={({ pressed }) => [
              styles.suggestionCard,
              pressed && styles.pressed,
            ]}
          >
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVgl1N0hvs0pggy4M2cz_04Dp0uPFBUd-uLqeZqGqh_J_esWP2EBBsy0VHlD6Ua2elrikxBV8aNEHxlH-SOGSmfVW_wI6L1KxPK12q7VNYEMQkZcpGZBXhyOoRLhVj0OTj3NEyHmfiUdM4tGCVfdRzjNIYEoDiKWAiH7af706e5A8Nz9xAH9cXyZ2K1dCN3y0m2xkf6z4NZryLfB2f29R3RZYA8_VYm2X6XVQcuo1ziAwMfxzICgkCGqcBVX_mo5jcf01_6hT0GYQz",
              }}
              style={styles.suggestionImage}
              contentFit="cover"
            />
            <View style={styles.suggestionOverlay} />
            <View style={styles.suggestionContent}>
              <View style={styles.suggestionTag}>
                <Text style={styles.suggestionTagText}>EVENING MEDITATION</Text>
              </View>
              <Text style={styles.suggestionTitle}>Walking in the Light</Text>
              <Text style={styles.suggestionSubtitle}>
                A guided 15-minute retreat experience.
              </Text>
            </View>
          </Pressable>
        </MotiView>
      </ScrollView>
    </View>
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
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.xs,
    width: 40,
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  heroSection: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  heroTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes["3xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
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
  progressInfo: {
    flex: 1,
  },
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
  tasksSection: {
    marginBottom: spacing.xl,
  },
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
  tasksList: {
    gap: spacing.sm,
  },
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
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: "rgba(138, 110, 71, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  taskIconContainerPending: {
    backgroundColor: colors.background,
  },
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
  suggestionCard: {
    height: 200,
    borderRadius: radii.xl,
    overflow: "hidden",
    marginTop: spacing.sm,
    ...shadows.lg,
  },
  suggestionImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  suggestionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  suggestionContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
  },
  suggestionTag: {
    backgroundColor: colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  suggestionTagText: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 1,
  },
  suggestionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: "rgba(255,255,255,0.8)",
  },
});
