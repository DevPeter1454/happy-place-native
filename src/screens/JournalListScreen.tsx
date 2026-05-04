import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MotiView } from "moti";
import { Menu, Search, Plus } from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import { JournalCard } from "../components/journal/JournalCard";
import type { MainTabScreenProps } from "../navigation/types";

// --- Mock Data ---
const MOCK_ENTRIES = [
  {
    id: "1",
    date: "June 4",
    previewText:
      "Today I felt a profound sense of peace while walking through the park. The way the light filtered through the oak trees...",
    time: "10:45 AM",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqPfhunxdv1c-Pzuh3WZSJw8BPwhvSzZJIgLqrLXsnSkfgPuxc7Hy8Y6zNzgdCx9KAc9W9FyLmHLEWP4CVgn-jwQSDiCBl2FMNmPYr3In_PLObAsnRJX44GZlkFE8yslNy1tmxGJJexfXgb9bLQ4jkc2PgOQ4g9ScSZH49STkGGD_uUZOTldP5kfmGhNSGH7aV8m8lRJPH_ZglytYQOLImCR1xRpN6TXIXbCNq2OapwlN7xactTzF7-G5dx3c7tTiOhaGAiffFH-Ub",
    isFavorite: false,
  },
  {
    id: "2",
    date: "June 2",
    previewText:
      "Reflecting on the small wins of the week, like finishing that book I started months ago. It feels good to prioritize my...",
    time: "8:15 PM",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0NUjit9msxot8o2d7ESaWoVGH8dnTbH9zkiJ_yafu3oBRNrFfcwJM0rfh1WP4iEeoPitl6kF8-J2IpIdCo809RavtWd3dOQ1T-uhMR-qjQu0x_buBOziorX_bp4I2I7zrJ7uUdBXBNvHDB-Yt8X_PELzXiqlptXhUC79uDT4daXayBsv9_-ApBG9dnmU0OJZcdUr0ESHKx4ucNp6VRtX6CcjjE2rDcsGlNMIc2XMC0Sj8d17DYB9kA_YjVhsDBqZE1bwzDfKJS3p_",
    isFavorite: true,
  },
  {
    id: "3",
    date: "May 31",
    previewText:
      "Quiet moments in the morning are becoming my favorite part of the day. The city is still sleeping and the world...",
    time: "6:30 AM",
    isFavorite: false,
  },
];

const TABS = ["All Entries", "Favorites", "Monthly"];

export function JournalListScreen({
  navigation: tabNavigation,
}: MainTabScreenProps<"Journal">) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState("All Entries");
  const [entries, setEntries] = useState(MOCK_ENTRIES);

  const toggleFavorite = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
      )
    );
  };

  const filteredEntries = entries.filter((entry) => {
    if (activeTab === "Favorites") return entry.isFavorite;
    // For now "Monthly" will just show all, since we don't have month filtering logic yet
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header Container (Sticky) */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, spacing.lg) },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton}>
            <Menu size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>My Journal</Text>
          <Pressable style={styles.iconButton}>
            <Search size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.listContainer}
        >
          {filteredEntries.map((entry) => (
            <JournalCard
              key={entry.id}
              id={entry.id}
              date={entry.date}
              previewText={entry.previewText}
              time={entry.time}
              imageUrl={entry.imageUrl}
              isFavorite={entry.isFavorite}
              onToggleFavorite={() => toggleFavorite(entry.id)}
            />
          ))}
          {filteredEntries.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No entries found.</Text>
            </View>
          )}
        </MotiView>
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate("NewJournalEntry")}
      >
        <Plus size={32} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: "rgba(248, 246, 242, 0.9)", // Matches background-light with opacity
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  iconButton: {
    padding: spacing.sm,
  },
  tabsContainer: {
    paddingHorizontal: spacing.xl,
  },
  tab: {
    paddingBottom: spacing.sm,
    marginRight: spacing["2xl"],
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: "#94A3B8", // slate-400
  },
  activeTabText: {
    fontWeight: "600",
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120, // Tab bar padding + FAB padding
  },
  listContainer: {
    gap: spacing.xl,
  },
  emptyState: {
    paddingVertical: spacing["3xl"],
    alignItems: "center",
  },
  emptyStateText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
  },
  fab: {
    position: "absolute",
    bottom: 100, // Above tab bar
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    zIndex: 20,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
});
