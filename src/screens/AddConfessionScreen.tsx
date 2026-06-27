import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Book,
  Lightbulb,
  CheckCircle2,
} from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";

export function AddConfessionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [confession, setConfession] = useState("");
  const [reference, setReference] = useState("");

  const handleSave = () => {
    // In a real app, logic to save would go here
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Confession</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>My Confession</Text>
          <Text style={styles.heroSubtitle}>
            Speak life into your day with a personal affirmation or spiritual truth.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>THE CONFESSION</Text>
          <TextInput
            style={styles.textArea}
            placeholder="I am loved by God and filled with His peace today..."
            placeholderTextColor="rgba(138, 110, 71, 0.4)"
            multiline
            value={confession}
            onChangeText={setConfession}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SCRIPTURE REFERENCE (OPTIONAL)</Text>
          <View style={styles.inputWrapper}>
            <Book size={18} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Romans 8:38"
              placeholderTextColor="rgba(138, 110, 71, 0.4)"
              value={reference}
              onChangeText={setReference}
            />
          </View>
        </View>

        <View style={styles.quoteBox}>
          <View style={styles.quoteIconWrapper}>
            <Lightbulb size={20} color={colors.primary} />
          </View>
          <Text style={styles.quoteText}>
            "Death and life are in the power of the tongue."{"\n"}
            <Text style={styles.quoteReference}>- Proverbs 18:21</Text>
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            !confession && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!confession}
        >
          <CheckCircle2 size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>Save Confession</Text>
        </Pressable>
      </View>
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
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
  },
  heroSection: {
    marginBottom: spacing["2xl"],
  },
  heroTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    minHeight: 160,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.1)",
    ...shadows.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.1)",
    ...shadows.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  quoteBox: {
    flexDirection: "row",
    backgroundColor: "rgba(138, 110, 71, 0.05)",
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  quoteIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: "rgba(138, 110, 71, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  quoteText: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontStyle: "italic",
    color: colors.textPrimary,
    lineHeight: 20,
    opacity: 0.8,
  },
  quoteReference: {
    fontWeight: "700",
    fontStyle: "normal",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    height: 64,
    borderRadius: radii.xl,
    gap: spacing.sm,
    ...shadows.md,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(138, 110, 71, 0.3)",
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.white,
  },
});
