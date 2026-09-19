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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, AtSign, Pencil, User } from "lucide-react-native";
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
import { useAvatarUpload } from "../hooks/useAvatarUpload";
import { Avatar } from "../components/profile/Avatar";
import { PhotoSourceSheet } from "../components/profile/PhotoSourceSheet";
import { setFullName as saveFullName } from "../services/user.service";

/**
 * Edit the two things a user owns about their identity: their picture and their
 * name. The email is shown read-only — changing it re-verifies the account, so
 * it is deliberately not editable here.
 */
export function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const avatar = useAvatarUpload();

  const storedName = profile?.fullName ?? user?.displayName ?? "";
  const email = profile?.email ?? user?.email ?? "";

  const [name, setName] = React.useState(storedName);
  const [saving, setSaving] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const trimmed = name.trim();
  const isDirty = trimmed !== storedName.trim();
  const canSave = trimmed.length >= 2 && isDirty && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to edit your profile.");
      return;
    }
    setSaving(true);
    try {
      await saveFullName(user.uid, trimmed);
      await refreshProfile();
      showToast("Profile updated");
      navigation.goBack();
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (!isDirty) {
      navigation.goBack();
      return;
    }
    Alert.alert("Discard changes?", "Your edits won't be saved.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable style={styles.headerButton} onPress={handleBack} hitSlop={8}>
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Information</Text>
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
        <View style={styles.avatarSection}>
          <Pressable
            style={styles.avatarContainer}
            onPress={() => setSheetOpen(true)}
            disabled={avatar.busy}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
          >
            <View style={styles.avatarBorder}>
              <Avatar uri={avatar.photoURL} name={trimmed || storedName} size={96} />
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
          <Pressable onPress={() => setSheetOpen(true)} disabled={avatar.busy}>
            <Text style={styles.changePhoto}>Change photo</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputWrapper}>
            <User size={18} color={colors.primary} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              style={styles.input}
            />
          </View>
          {trimmed.length > 0 && trimmed.length < 2 ? (
            <Text style={styles.hintError}>
              Please enter at least 2 characters.
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
            <AtSign size={18} color={colors.textMuted} />
            <Text style={styles.readOnlyValue} numberOfLines={1}>
              {email || "—"}
            </Text>
          </View>
          <Text style={styles.hint}>
            Your email is how you sign in and can't be changed here.
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            !canSave && styles.saveButtonDisabled,
            pressed && canSave && styles.saveButtonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>Save changes</Text>
          )}
        </Pressable>
      </ScrollView>

      <PhotoSourceSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onTakePhoto={avatar.takePhoto}
        onChooseFromLibrary={avatar.chooseFromLibrary}
        onRemovePhoto={avatar.photoURL ? avatar.removePhoto : undefined}
      />
    </KeyboardAvoidingView>
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
  avatarSection: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
  },
  avatarBorder: {
    padding: 4,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: colors.primaryLight,
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
    gap: 2,
    backgroundColor: "rgba(26, 26, 26, 0.45)",
  },
  avatarProgress: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.sm,
  },
  changePhoto: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.xl,
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
  inputWrapperDisabled: {
    backgroundColor: colors.primaryLight05,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  readOnlyValue: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
  },
  hint: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  hintError: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  saveButton: {
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
});
