import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { ChevronRight, Bell, Shield, CircleHelp, LogOut, ChevronLeft, User, Pencil } from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from "../theme";
import { useAuth } from "../context/AuthContext";

const FALLBACK_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8elyt9jBN6VgtRWx24O1TIUQvbtRerOk1fIvJoXkWBECpgNa8Ec-z3w97A6cLkQtCi6UK0hZU69G70fZnaNTA8wtX90OD9Rp80YlR6Muvl6VFIZa7f7F4rBqj1ZcOHGwOvgxj8pfVMT-3QSv6xESKa6eT5eT6xGI-eg0pGgECwV_0eCX4biKkMLyyGda_tY-zKMTFDwqu16bZYxyXoaM2pcov6ehiQBgQ0LY1ItUJvOLXBEQCKGVKNzWbrvmyq1DkEERlyP8MNveC";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const [remindersEnabled, setRemindersEnabled] = React.useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  const displayName = profile?.fullName ?? user?.displayName ?? "Friend";
  const displayEmail = profile?.email ?? user?.email ?? "";
  const avatarUri = profile?.photoURL ?? user?.photoURL ?? FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable style={styles.headerButton}>
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButton} />
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
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              </View>
              <Pressable style={styles.editBadge}>
                <Pencil size={12} color={colors.white} />
              </Pressable>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              {displayEmail ? (
                <Text style={styles.userEmail}>{displayEmail}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <View style={styles.iconBox}>
                  <Bell size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Daily Reminders</Text>
                  <Text style={styles.settingSubtitle}>Morning and evening prayers</Text>
                </View>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={setRemindersEnabled}
                trackColor={{ false: "#E5E5E5", true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <View style={styles.iconBox}>
                  <Bell size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingSubtitle}>Retreat updates and community</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E5E5E5", true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.menuContainer}>
              <Pressable style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed, styles.menuItemDivider]}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconBox}>
                    <User size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>Personal Information</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>

              <Pressable style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed, styles.menuItemDivider]}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconBox}>
                    <Shield size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>Privacy & Security</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>

              <Pressable style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconBox}>
                    <CircleHelp size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>Support Center</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.logoutSection}>
            <Pressable
              onPress={() => signOut()}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
            >
              <LogOut size={20} color={colors.primary} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
            <Text style={styles.versionInfo}>HAPPY PLACE V2.4.0</Text>
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
    backgroundColor: "rgba(248, 246, 242, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138, 110, 71, 0.1)",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  profileCard: {
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  avatarBorder: {
    padding: 4,
    borderRadius: radii.full,
    borderWidth: 4,
    borderColor: "rgba(138, 110, 71, 0.1)",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: radii.full,
  },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.sm,
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontFamily: fontFamilies.serif,
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
    opacity: 0.7,
    fontWeight: "500",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.05)",
    ...shadows.sm,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.05)",
    overflow: "hidden",
    marginTop: spacing.md,
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  menuItemPressed: {
    backgroundColor: "rgba(138, 110, 71, 0.05)",
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138, 110, 71, 0.05)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: "rgba(138, 110, 71, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  logoutSection: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(138, 110, 71, 0.1)",
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    width: "100%",
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
  versionInfo: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: "rgba(138, 110, 71, 0.4)",
    fontWeight: "700",
    marginTop: spacing.xl,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
