import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import { MotiView } from "moti";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ChevronRight,
  BellRing,
  Smartphone,
  Shield,
  CircleHelp,
  LogOut,
  ChevronLeft,
  User,
  Pencil,
  Clock,
} from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useTabBarVisibility } from "../context/TabBarContext";
import { useToast } from "../context/ToastContext";
import { useAvatarUpload } from "../hooks/useAvatarUpload";
import { Avatar } from "../components/profile/Avatar";
import { PhotoSourceSheet } from "../components/profile/PhotoSourceSheet";
import { updatePreferences } from "../services/user.service";
import {
  ensurePermissions,
  scheduleDailyPrayerReminder,
  cancelPrayerReminder,
} from "../services/notifications.service";
import {
  DEFAULT_REMINDER,
  dateToTime,
  formatTime,
  timeToDate,
} from "../utils/time";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { onScroll } = useTabBarVisibility();
  const { showToast } = useToast();
  const avatar = useAvatarUpload();

  const [savingPrefs, setSavingPrefs] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerValue, setPickerValue] = React.useState(() =>
    timeToDate(DEFAULT_REMINDER),
  );

  // Preferences are the source of truth; both switches read straight from them
  // so what's on screen always matches what's persisted.
  const remindersEnabled = profile?.preferences?.notifications ?? true;
  const pushEnabled = profile?.preferences?.pushNotifications ?? false;
  const reminderTime = profile?.preferences?.reminderTime ?? DEFAULT_REMINDER;

  const displayName = profile?.fullName ?? user?.displayName ?? "Friend";
  const displayEmail = profile?.email ?? user?.email ?? "";
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  /** Persist a preferences patch, then re-read the profile so the UI follows. */
  const savePreferences = async (
    patch: Parameters<typeof updatePreferences>[2],
    after?: () => Promise<void>,
  ) => {
    if (!user?.uid || savingPrefs) return;
    setSavingPrefs(true);
    try {
      await updatePreferences(user.uid, profile?.preferences, patch);
      await refreshProfile();
      await after?.();
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
      // Re-read so a failed write can't leave the switch showing a lie.
      await refreshProfile().catch(() => {});
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleReminders = (value: boolean) =>
    savePreferences({ notifications: value }, async () => {
      if (!value) {
        await cancelPrayerReminder();
        return;
      }
      const granted = await ensurePermissions();
      if (granted) {
        await scheduleDailyPrayerReminder(reminderTime);
        showToast(`Reminder set for ${formatTime(reminderTime)}`);
      } else {
        showToast("Allow notifications to be reminded");
      }
    });

  const togglePush = (value: boolean) =>
    savePreferences({ pushNotifications: value }, async () => {
      // Opting in is only meaningful once the OS has granted permission.
      if (value && !(await ensurePermissions())) {
        showToast("Allow notifications in Settings to receive updates");
      }
    });

  const openTimePicker = () => {
    setPickerValue(timeToDate(reminderTime));
    setPickerOpen(true);
  };

  const saveReminderTime = (date: Date) => {
    const time = dateToTime(date);
    savePreferences({ reminderTime: time }, async () => {
      if (!remindersEnabled) {
        showToast(`Reminder time set to ${formatTime(time)}`);
        return;
      }
      const granted = await ensurePermissions();
      if (granted) await scheduleDailyPrayerReminder(time);
      showToast(
        granted
          ? `Reminder set for ${formatTime(time)}`
          : "Saved — allow notifications to be reminded",
      );
    });
  };

  // Android shows a dialog reporting the result through onChange; iOS uses an
  // inline spinner in a modal with an explicit Done.
  const onAndroidPicked = (event: DateTimePickerEvent, date?: Date) => {
    setPickerOpen(false);
    if (event.type === "set" && date) saveReminderTime(date);
  };

  const confirmSignOut = () => {
    Alert.alert("Log out?", "You'll need to sign in again to continue.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert("Couldn't log out", "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        {navigation.canGoBack() ? (
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 88 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
        >
          <View style={styles.profileCard}>
            <Pressable
              style={styles.avatarContainer}
              onPress={() => setSheetOpen(true)}
              disabled={avatar.busy}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
            >
              <View style={styles.avatarBorder}>
                <Avatar uri={avatar.photoURL} name={displayName} size={120} />
                {avatar.busy ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={colors.white} />
                    {avatar.progress > 0 ? (
                      <Text style={styles.avatarProgress}>
                        {Math.round(avatar.progress * 100)}%
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
              <View style={styles.editBadge}>
                <Pencil size={12} color={colors.white} />
              </View>
            </Pressable>
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
                  <BellRing size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingLabel}>Daily Reminders</Text>
                  <Text style={styles.settingSubtitle}>
                    A nudge to pray at {formatTime(reminderTime)}
                  </Text>
                </View>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={toggleReminders}
                disabled={savingPrefs}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <Pressable
              onPress={openTimePicker}
              disabled={savingPrefs}
              style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={styles.settingItemLeft}>
                <View style={styles.iconBox}>
                  <Clock size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingLabel}>Reminder Time</Text>
                  <Text style={styles.settingSubtitle}>
                    When your daily nudge arrives
                  </Text>
                </View>
              </View>
              <View style={styles.trailing}>
                <Text style={styles.trailingValue}>
                  {formatTime(reminderTime)}
                </Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Pressable>

            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <View style={styles.iconBox}>
                  <Smartphone size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingSubtitle}>
                    Retreat updates and community
                  </Text>
                </View>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                disabled={savingPrefs}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.menuContainer}>
              <MenuItem
                icon={<User size={20} color={colors.primary} />}
                label="Personal Information"
                onPress={() => navigation.navigate("EditProfile")}
                divider
              />
              <MenuItem
                icon={<Shield size={20} color={colors.primary} />}
                label="Privacy & Security"
                onPress={() => navigation.navigate("PrivacySecurity")}
                divider
              />
              <MenuItem
                icon={<CircleHelp size={20} color={colors.primary} />}
                label="Support Center"
                onPress={() => navigation.navigate("SupportCenter")}
              />
            </View>
          </View>

          <View style={styles.logoutSection}>
            <Pressable
              onPress={confirmSignOut}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
            >
              <LogOut size={20} color={colors.primary} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
            <Text style={styles.versionInfo}>
              HAPPY PLACE V{appVersion}
            </Text>
          </View>
        </MotiView>
      </ScrollView>

      <PhotoSourceSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onTakePhoto={avatar.takePhoto}
        onChooseFromLibrary={avatar.chooseFromLibrary}
        onRemovePhoto={avatar.photoURL ? avatar.removePhoto : undefined}
      />

      {pickerOpen && Platform.OS === "android" ? (
        <DateTimePicker value={pickerValue} mode="time" onChange={onAndroidPicked} />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={pickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerOpen(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Daily Reminder Time</Text>
              <DateTimePicker
                value={pickerValue}
                mode="time"
                display="spinner"
                // The modal's window doesn't inherit the app's forced-light
                // appearance, so the wheel would render dark-mode (white) text
                // on this light card unless it's pinned here.
                themeVariant="light"
                textColor={colors.textPrimary}
                onChange={(_e, date) => date && setPickerValue(date)}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setPickerOpen(false)}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPickerOpen(false);
                    saveReminderTime(pickerValue);
                  }}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    pressed && styles.logoutButtonPressed,
                  ]}
                >
                  <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>
                    Done
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  divider,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
        divider && styles.menuItemDivider,
      ]}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
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
  avatarOverlay: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(26, 26, 26, 0.45)",
  },
  avatarProgress: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
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
    textAlign: "center",
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
  settingTextWrap: {
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
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  trailingValue: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    padding: spacing.xl,
  },
  modalTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
  modalBtnTextPrimary: {
    color: colors.white,
  },
});
