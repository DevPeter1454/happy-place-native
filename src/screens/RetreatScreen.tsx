import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { Image } from "expo-image";
import { MotiView } from "moti";
import {
  Calendar,
  CalendarDays,
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

export function RetreatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, spacing.md) },
        ]}
      >
        <Text style={styles.headerTitle}>Spiritual Retreat</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          {/* Hero Image Section */}
          <View style={styles.heroContainer}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_U8VpNVd4BkrauPX4xBueFePJ-pI-3wyJvdN5imrJtiz_caBTfaWnlKhl8exx_9q3E8Ni_XQxITEnJZG6rE6ELveQ5gviWrTr4fC0rY36448TXlMdWVNOqkFxvcGiFVRjA9oPMBXF-5QthmnMHrSRQn80c8SnVPX7ayCu34HqFWR86-zJ2UeXSsSGObY6D53xYXSfzryXNJYN99NJIWNxiHpt7MixYAr-GzbXeIh8aAKEJuXOci1cDw2RI29aAoVHBPQOUF1XraRM",
              }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          </View>

          {/* Copy Section */}
          <View style={styles.copySection}>
            <Text style={styles.copyTitle}>Set Your Intentions</Text>
            <Text style={styles.copySubtitle}>
              Carve out time for deep reflection. Disconnect to reconnect with
              your spiritual journey.
            </Text>
          </View>

          {/* Date Picker Form (Mockup) */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <Pressable style={styles.inputWrapper}>
                <Text style={styles.inputText}>Oct 24, 2023</Text>
                <Calendar size={20} color="rgba(138, 110, 71, 0.6)" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date</Text>
              <Pressable style={styles.inputWrapper}>
                <Text style={styles.inputText}>Oct 27, 2023</Text>
                <CalendarDays size={20} color="rgba(138, 110, 71, 0.6)" />
              </Pressable>
            </View>
          </View>

          {/* Calendar Preview */}
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>October 2023</Text>
              <View style={styles.calendarNav}>
                <ChevronLeft size={20} color={colors.primary} />
                <ChevronRight size={20} color={colors.primary} />
              </View>
            </View>

            <View style={styles.calendarGrid}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <Text key={i} style={styles.calendarDayLabel}>
                  {day}
                </Text>
              ))}

              {/* Mock Days */}
              <View style={styles.calendarDay}>
                <Text style={styles.textMuted}>22</Text>
              </View>
              <View style={styles.calendarDay}>
                <Text style={styles.textMuted}>23</Text>
              </View>

              <View style={[styles.calendarDay, styles.calendarDayStart]}>
                <Text style={styles.textWhite}>24</Text>
              </View>
              <View style={[styles.calendarDay, styles.calendarDayMid]}>
                <Text style={styles.textPrimary}>25</Text>
              </View>
              <View style={[styles.calendarDay, styles.calendarDayMid]}>
                <Text style={styles.textPrimary}>26</Text>
              </View>
              <View style={[styles.calendarDay, styles.calendarDayStart]}>
                <Text style={styles.textWhite}>27</Text>
              </View>

              <View style={styles.calendarDay}>
                <Text style={styles.textDefault}>28</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={() => navigation.navigate("RetreatDashboard")}
          >
            <Text style={styles.ctaText}>Start Retreat</Text>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    padding: spacing.md,
  },
  heroImage: {
    width: "100%",
    minHeight: 220,
    borderRadius: radii.xl,
    backgroundColor: colors.primaryLight05,
  },
  copySection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  copyTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  copySubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  formSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  inputGroup: {},
  inputLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight05,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.2)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  inputText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  calendarContainer: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.primaryLight05,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  calendarTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  calendarNav: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarDayLabel: {
    width: "14%",
    textAlign: "center",
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "500",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  calendarDay: {
    width: "14%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  calendarDayStart: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  calendarDayMid: {
    backgroundColor: "rgba(138, 110, 71, 0.2)",
  },
  textMuted: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  textDefault: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  textWhite: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.white,
  },
  textPrimary: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: colors.primary,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    shadowColor: colors.primary,
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
});
