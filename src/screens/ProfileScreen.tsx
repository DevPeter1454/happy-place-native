import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MotiView } from "moti";
import {
  Settings,
  ChevronRight,
  Bell,
  Shield,
  CircleHelp,
  LogOut,
  Award,
  Calendar,
  Heart,
  ChevronLeft,
} from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";

/**
 * Profile Screen
 * Integrated from Stitch ID: e2445a39d0e449538fe33d674f9bc7b2
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      id: "notifications",
      icon: <Bell size={20} color={colors.primary} />,
      label: "Notifications",
      subtitle: "Daily reminders & updates",
    },
    {
      id: "privacy",
      icon: <Shield size={20} color={colors.primary} />,
      label: "Privacy & Security",
      subtitle: "Manage your data & account",
    },
    {
      id: "help",
      icon: <CircleHelp size={20} color={colors.primary} />,
      label: "Help & Support",
      subtitle: "FAQs & contact us",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, spacing.md) },
        ]}
      >
        <Pressable style={styles.headerButton}>
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable style={styles.headerButton}>
          <Settings size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
        >
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Peter Peterson</Text>
              <Text style={styles.userRole}>Premium Member</Text>
            </View>
            <Pressable style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </Pressable>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#F0F9FF" }]}
              >
                <Calendar size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statBox}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#F0FDF4" }]}
              >
                <Award size={20} color="#22C55E" />
              </View>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
            <View style={styles.statBox}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#FFF1F2" }]}
              >
                <Heart size={20} color="#F43F5E" />
              </View>
              <Text style={styles.statValue}>128</Text>
              <Text style={styles.statLabel}>Prayers</Text>
            </View>
          </View>

          {/* Menu Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                    index !== menuItems.length - 1 && styles.menuItemDivider,
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBox}>{item.icon}</View>
                    <View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
            <Text style={styles.versionInfo}>App Version 1.0.2 (240504)</Text>
          </View>
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.md,
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: colors.white,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: radii.full,
    backgroundColor: "#22C55E",
    borderWidth: 3,
    borderColor: colors.white,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  userName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userRole: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  editProfileButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight05,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  editProfileText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing["2xl"],
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: spacing["2xl"],
  },
  sectionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    overflow: "hidden",
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  menuItemPressed: {
    backgroundColor: colors.background,
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: "rgba(138, 110, 71, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  logoutSection: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#FEF2F2",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["2xl"],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    width: "100%",
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: "#EF4444",
  },
  versionInfo: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: "center",
  },
});
