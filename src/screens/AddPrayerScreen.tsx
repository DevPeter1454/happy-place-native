import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { X, CheckCircle2 } from "lucide-react-native";
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
import { addActivity } from "../services/activities.service";
import type { RootStackScreenProps } from "../navigation/types";

/**
 * Composer for a new prayer. Prayers are stored as `prayer` activities with the
 * text in `notes`, so saving one also marks today's prayer complete and counts
 * toward the streak.
 *
 * This is a navigated screen rather than a React Native `Modal` on purpose: a
 * `Modal` gets its own Android dialog window whose `SOFT_INPUT_ADJUST_RESIZE` is
 * ignored under edge-to-edge, so the keyboard covered the text area on newer
 * devices. A real screen lives in the main window, where KeyboardAvoidingView
 * behaves — the same arrangement the journal composer already uses.
 */
export function AddPrayerScreen({
  navigation,
}: RootStackScreenProps<"AddPrayer">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const body = text.trim();
  const canSave = body.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to add a prayer.");
      return;
    }
    setSaving(true);
    try {
      await addActivity(user.uid, { type: "prayer", notes: body });
      showToast("Prayer added 🙏");
      navigation.goBack();
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!body) {
      navigation.goBack();
      return;
    }
    Alert.alert("Discard this prayer?", "What you've written won't be saved.", [
      { text: "Keep writing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400 }}
        style={[styles.content, { paddingTop: Math.max(insets.top, spacing.lg) }]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <X size={26} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add a Prayer</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.mainArea}>
          <View style={styles.note}>
            <CheckCircle2 size={16} color={colors.primary} />
            <Text style={styles.noteText}>
              Saving also marks today's prayer complete.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Your prayer</Text>
            <TextInput
              style={styles.bodyInput}
              placeholder="Write your prayer…"
              placeholderTextColor="rgba(138, 110, 71, 0.3)"
              multiline
              textAlignVertical="top"
              autoFocus
              value={text}
              onChangeText={setText}
            />
          </View>
        </View>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && canSave && styles.saveBtnPressed,
              !canSave && styles.saveBtnDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Prayer</Text>
            )}
          </Pressable>
        </View>
      </MotiView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPressed: {
    backgroundColor: colors.primaryLight,
  },
  headerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  mainArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.primaryLight30,
    marginBottom: spacing.sm,
  },
  bodyInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    padding: spacing.lg,
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    lineHeight: 28,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  saveBtn: {
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  saveBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
});
