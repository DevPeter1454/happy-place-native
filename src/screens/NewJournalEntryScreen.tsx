import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { X, Calendar, Sun } from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import type { RootStackScreenProps } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { addEntry } from "../services/journal.service";
import { MOODS } from "../constants/moods";

/** Formats a date as e.g. "Today, Jun 27" (or "Mon, Jun 27" for past dates). */
function formatEntryDate(d: Date): string {
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${isToday ? "Today" : weekday}, ${month} ${d.getDate()}`;
}

export function NewJournalEntryScreen({
  navigation,
}: RootStackScreenProps<"NewJournalEntry">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState(MOODS[0].label);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateLabel = formatEntryDate(new Date());

  const handleSave = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody || saving) return;
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to save your reflection.");
      return;
    }

    setSaving(true);
    try {
      // Saving an entry is what flips the Home dashboard's Journal task to
      // "done" for today (the dashboard checks today's journal entries).
      await addEntry(user.uid, {
        body: trimmedBody,
        mood,
        ...(title.trim() ? { title: title.trim() } : {}),
      });
      navigation.goBack();
    } catch {
      Alert.alert(
        "Couldn't save",
        "Something went wrong saving your reflection. Please try again."
      );
      setSaving(false);
    }
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
        {/* Header Section */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <X size={28} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Reflection</Text>
          {/* Spacer keeps the title centered now the menu button is gone. */}
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.mainArea}>
          {/* Metadata Selector */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Calendar size={20} color={colors.primaryLight30} />
              <Text style={styles.metadataText}>{dateLabel}</Text>
            </View>
            <View style={styles.metadataDivider} />
            <Pressable
              style={styles.metadataItem}
              onPress={() => setShowMoodPicker((v) => !v)}
            >
              <Sun size={20} color={colors.primaryLight30} />
              <Text style={styles.metadataText}>Feeling {mood}</Text>
            </Pressable>
          </View>

          {/* Mood Picker */}
          <AnimatePresence>
            {showMoodPicker && (
              <MotiView
                from={{ opacity: 0, translateY: -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -8 }}
                transition={{ type: "timing", duration: 200 }}
                style={styles.moodPicker}
              >
                {MOODS.map((m) => {
                  const selected = m.label === mood;
                  return (
                    <Pressable
                      key={m.label}
                      onPress={() => {
                        setMood(m.label);
                        setShowMoodPicker(false);
                      }}
                    >
                      <MotiView
                        animate={{
                          scale: selected ? 1.06 : 1,
                          backgroundColor: selected
                            ? colors.primary
                            : colors.white,
                          borderColor: selected
                            ? colors.primary
                            : colors.primaryLight05,
                        }}
                        transition={{
                          type: "spring",
                          damping: 14,
                          stiffness: 220,
                        }}
                        style={styles.moodChip}
                      >
                        <Text style={styles.moodEmoji}>{m.emoji}</Text>
                        <Text
                          style={[
                            styles.moodChipText,
                            selected && styles.moodChipTextSelected,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </MotiView>
                    </Pressable>
                  );
                })}
              </MotiView>
            )}
          </AnimatePresence>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Untitled Reflection"
              placeholderTextColor="rgba(138, 110, 71, 0.2)"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Reflection Body Input */}
          <View style={[styles.inputContainer, styles.bodyContainer]}>
            <Text style={styles.inputLabel}>Reflection</Text>
            <TextInput
              style={styles.bodyInput}
              placeholder="Start writing your thoughts here..."
              placeholderTextColor="rgba(138, 110, 71, 0.2)"
              multiline
              textAlignVertical="top"
              value={body}
              onChangeText={setBody}
            />
          </View>
        </View>

        {/* Footer / Action Bar */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              (!body.trim() || saving) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!body.trim() || saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save Entry"}
            </Text>
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
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPressed: {
    backgroundColor: colors.primaryLight05,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: fontFamilies.serif,
    fontSize: 28,
    fontWeight: "500",
    color: colors.primary,
  },
  mainArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metadataText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: colors.primaryLight30,
  },
  metadataDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(138, 110, 71, 0.2)",
  },
  moodPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: -spacing.md,
    marginBottom: spacing.xl,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    // backgroundColor + borderColor are animated by Moti on selection.
  },
  moodEmoji: {
    fontSize: fontSizes.sm,
  },
  moodChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  moodChipTextSelected: {
    color: colors.white,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  bodyContainer: {
    flex: 1,
    marginBottom: 0,
  },
  inputLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: "rgba(138, 110, 71, 0.4)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  titleInput: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    color: colors.textPrimary,
    padding: 0,
  },
  bodyInput: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: 28,
    padding: 0,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: "rgba(248, 246, 242, 0.8)",
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight05,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing["2xl"],
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    shadowColor: colors.primary,
  },
  saveBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  saveBtnDisabled: {
    backgroundColor: colors.primaryLight30,
    shadowOpacity: 0,
  },
  saveBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
});
