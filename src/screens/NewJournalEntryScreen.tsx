import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import {
  X,
  MoreHorizontal,
  Calendar,
  Sun,
  Image as ImageIcon,
  Mic,
  List,
} from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import type { RootStackScreenProps } from "../navigation/types";

export function NewJournalEntryScreen({
  navigation,
}: RootStackScreenProps<"NewJournalEntry">) {
  const insets = useSafeAreaInsets();

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
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <MoreHorizontal size={28} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.mainArea}>
          {/* Metadata Selector */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Calendar size={20} color={colors.primaryLight30} />
              <Text style={styles.metadataText}>Today, Oct 24</Text>
            </View>
            <View style={styles.metadataDivider} />
            <View style={styles.metadataItem}>
              <Sun size={20} color={colors.primaryLight30} />
              <Text style={styles.metadataText}>Feeling Grateful</Text>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Untitled Reflection"
              placeholderTextColor="rgba(138, 110, 71, 0.2)"
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
          <View style={styles.footerActions}>
            <Pressable style={styles.footerIconBtn}>
              <ImageIcon size={24} color={colors.primaryLight30} />
            </Pressable>
            <Pressable style={styles.footerIconBtn}>
              <Mic size={24} color={colors.primaryLight30} />
            </Pressable>
            <Pressable style={styles.footerIconBtn}>
              <List size={24} color={colors.primaryLight30} />
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
            ]}
          >
            <Text style={styles.saveBtnText}>Save Entry</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: "rgba(248, 246, 242, 0.8)",
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight05,
  },
  footerActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  footerIconBtn: {
    padding: spacing.sm,
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
  saveBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
});
