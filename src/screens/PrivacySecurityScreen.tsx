import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
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
import { useToast } from "../context/ToastContext";
import {
  changePassword,
  deleteAccount,
  hasPasswordProvider,
  mapAuthError,
  resetPassword,
} from "../services/auth.service";

const MIN_PASSWORD = 6;

/**
 * Security actions for the signed-in account: rotate the password, send a reset
 * email, and delete the account. Password-based actions are hidden for accounts
 * that signed in through a federated provider — there is no password to change.
 */
export function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const email = user?.email ?? "";
  const canUsePassword = hasPasswordProvider(user);

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [changing, setChanging] = React.useState(false);
  const [sendingReset, setSendingReset] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < MIN_PASSWORD;
  const canSubmit =
    !changing &&
    current.length > 0 &&
    next.length >= MIN_PASSWORD &&
    next === confirm;

  const handleChangePassword = async () => {
    if (!canSubmit) return;
    setError(null);
    setChanging(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      showToast("Password updated");
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setChanging(false);
    }
  };

  const handleSendReset = async () => {
    if (!email || sendingReset) return;
    setSendingReset(true);
    try {
      await resetPassword(email);
      showToast(`Reset link sent to ${email}`);
    } catch (e) {
      Alert.alert("Couldn't send email", mapAuthError(e));
    } finally {
      setSendingReset(false);
    }
  };

  /**
   * Deletion is two steps: an alert to confirm intent, then a sheet asking for
   * the password. The sheet is used instead of `Alert.prompt` because that is
   * iOS-only, and re-authentication is required by Firebase on both platforms.
   */
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account and profile. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            setDeletePassword("");
            setDeleteError(null);
            setDeleteOpen(true);
          },
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (deleting) return;
    if (canUsePassword && !deletePassword) {
      setDeleteError("Enter your password to continue.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(canUsePassword ? deletePassword : undefined);
      // Deleting the auth user flips onAuthStateChanged, which returns the app
      // to the auth flow on its own — no navigation needed here.
    } catch (e) {
      setDeleteError(mapAuthError(e));
      setDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <View style={styles.iconBox}>
            <ShieldCheck size={20} color={colors.primary} />
          </View>
          <Text style={styles.infoText}>
            Your journal, prayers and reflections are stored under your account
            and are only readable by you.
          </Text>
        </View>

        {canUsePassword ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change password</Text>

            <PasswordField
              label="Current password"
              value={current}
              onChangeText={(t) => {
                setCurrent(t);
                setError(null);
              }}
              icon={<Lock size={18} color={colors.primary} />}
            />
            <PasswordField
              label="New password"
              value={next}
              onChangeText={(t) => {
                setNext(t);
                setError(null);
              }}
              icon={<KeyRound size={18} color={colors.primary} />}
              hint={
                tooShort
                  ? `Use at least ${MIN_PASSWORD} characters.`
                  : undefined
              }
            />
            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                setError(null);
              }}
              icon={<KeyRound size={18} color={colors.primary} />}
              hint={mismatch ? "Passwords don't match." : undefined}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleChangePassword}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.primaryButtonPressed,
              ]}
            >
              {changing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Update password</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleSendReset}
              disabled={!email || sendingReset}
              style={({ pressed }) => [
                styles.secondaryRow,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.iconBox}>
                <Mail size={18} color={colors.primary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>Email me a reset link</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {email || "No email on this account"}
                </Text>
              </View>
              {sendingReset ? <ActivityIndicator color={colors.primary} /> : null}
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sign-in method</Text>
            <View style={styles.noticeCard}>
              <Text style={styles.rowSubtitle}>
                You sign in with a connected account, so there's no password to
                change here. Manage it with your sign-in provider.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger zone</Text>
          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.dangerRow,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={[styles.iconBox, styles.iconBoxDanger]}>
              <Trash2 size={18} color={colors.error} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowLabel, styles.dangerText]}>
                Delete my account
              </Text>
              <Text style={styles.rowSubtitle}>
                Permanently removes your account and profile
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={deleteOpen}
        transparent
        animationType="slide"
        onRequestClose={() => !deleting && setDeleteOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalFlex}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { paddingBottom: Math.max(insets.bottom, spacing.xl) },
              ]}
            >
              <Text style={styles.modalTitle}>Confirm deletion</Text>
              <Text style={styles.rowSubtitle}>
                {canUsePassword
                  ? "Enter your password to permanently delete your account."
                  : "This will permanently delete your account."}
              </Text>

              {canUsePassword ? (
                <View style={[styles.inputWrapper, styles.modalInput]}>
                  <Lock size={18} color={colors.primary} />
                  <TextInput
                    value={deletePassword}
                    onChangeText={(t) => {
                      setDeletePassword(t);
                      setDeleteError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    placeholder="Your password"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.input}
                  />
                </View>
              ) : null}

              {deleteError ? (
                <Text style={styles.error}>{deleteError}</Text>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setDeleteOpen(false)}
                  disabled={deleting}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDelete}
                  disabled={deleting}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    styles.modalBtnDanger,
                    pressed && styles.rowPressed,
                  ]}
                >
                  {deleting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text
                      style={[styles.modalBtnText, styles.modalBtnTextDanger]}
                    >
                      Delete forever
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  icon,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          placeholder="••••••••"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.input}
        />
      </View>
      {hint ? <Text style={styles.hintError}>{hint}</Text> : null}
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    marginBottom: spacing["2xl"],
    ...shadows.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing["2xl"],
  },
  sectionTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  hintError: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  error: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  primaryButton: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  noticeCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.missedBg,
    ...shadows.sm,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  dangerText: {
    color: colors.error,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxDanger: {
    backgroundColor: colors.missedBg,
  },
  modalFlex: {
    flex: 1,
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
    ...shadows["2xl"],
  },
  modalTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalInput: {
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  modalBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  modalBtnDanger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  modalBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
  modalBtnTextDanger: {
    color: colors.white,
  },
});
