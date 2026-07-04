import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing, radii } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { addActivity } from "../../services/activities.service";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after a prayer is saved so the caller can refresh. */
  onSaved: () => void;
}

/**
 * A small composer for a new prayer. Prayers are stored as `prayer` activities
 * (text in `notes`), so saving one also counts toward the prayer streak.
 */
export function AddPrayerModal({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setText("");
    onClose();
  };

  const handleSave = async () => {
    const body = text.trim();
    if (!body || saving) return;
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to add a prayer.");
      return;
    }
    setSaving(true);
    try {
      await addActivity(user.uid, { type: "prayer", notes: body });
      showToast("Prayer added 🙏");
      setText("");
      onSaved();
      onClose();
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.xl) },
            ]}
            onPress={() => {}}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Add a Prayer</Text>
              <Pressable onPress={close} hitSlop={8}>
                <X size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write your prayer…"
              placeholderTextColor={colors.textPlaceholder}
              multiline
              autoFocus
              style={styles.input}
            />

            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={({ pressed }) => [
                styles.saveBtn,
                (!text.trim() || saving) && styles.saveBtnDisabled,
                pressed && styles.saveBtnPressed,
              ]}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "Saving…" : "Save Prayer"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  input: {
    minHeight: 120,
    maxHeight: 220,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    padding: spacing.lg,
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  saveBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
});
