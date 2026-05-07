import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainTabParamList } from "../navigation/types";
import { ArrowLeft, Settings, Type, Palette, Bookmark, Check } from "lucide-react-native";
import { MotiView } from "moti";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";

const SCRIPTURE = [
  { verse: 1, text: "The Lord is my shepherd; I shall not want." },
  { verse: 2, text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters." },
  { verse: 3, text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake." },
  { verse: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me." },
  { verse: 5, text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over." },
  { verse: 6, text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever." },
];

export function BibleReaderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainTabParamList>>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Bible Reader</Text>
        <Pressable style={styles.headerButton}>
          <Settings size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
        >
          {/* Today's Reading Section */}
          <View style={styles.titleSection}>
            <Text style={styles.overtitle}>TODAY'S READING</Text>
            <Text style={styles.bookTitle}>Psalm 23</Text>
            <View style={styles.divider} />
          </View>

          {/* Scripture Content */}
          <View style={styles.scriptureContainer}>
            {SCRIPTURE.map((item) => (
              <View key={item.verse} style={styles.verseRow}>
                <Text style={styles.verseNumber}>{item.verse}</Text>
                <Text style={styles.verseText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Reading Controls */}
          <View style={styles.controlsRow}>
            <View style={styles.controlGroup}>
              <Pressable style={styles.controlButton}>
                <Type size={18} color={colors.textSecondary} />
                <Text style={styles.controlLabel}>A-</Text>
              </Pressable>
              <Pressable style={styles.controlButton}>
                <Type size={22} color={colors.textSecondary} />
                <Text style={styles.controlLabel}>A+</Text>
              </Pressable>
            </View>
            
            <View style={styles.colorGroup}>
              <View style={[styles.colorDot, { backgroundColor: '#FEF9C3', borderColor: '#FEF08A' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]} />
            </View>

            <Pressable style={styles.bookmarkButton}>
              <Bookmark size={22} color={colors.primary} />
            </Pressable>
          </View>

          {/* Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.readButton,
              pressed && styles.readButtonPressed,
            ]}
          >
            <Text style={styles.readButtonText}>Mark as Read</Text>
          </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
    backgroundColor: 'rgba(248, 246, 242, 0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  overtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
    opacity: 0.7,
  },
  bookTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 48,
    fontWeight: "700",
    fontStyle: "italic",
    color: colors.textPrimary,
  },
  divider: {
    width: 48,
    height: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.full,
    marginTop: spacing.md,
  },
  scriptureContainer: {
    marginBottom: spacing["2xl"],
  },
  verseRow: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  verseNumber: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes["3xl"],
    fontWeight: "700",
    color: colors.primary,
    marginRight: spacing.sm,
    width: 30,
    textAlign: "right",
    lineHeight: 32,
  },
  verseText: {
    flex: 1,
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: "justify",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  controlGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  colorGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  readButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing["2xl"],
    ...shadows.md,
    shadowColor: colors.primary,
  },
  readButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  readButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
});
