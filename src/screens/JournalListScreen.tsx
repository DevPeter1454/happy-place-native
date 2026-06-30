import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { MotiView } from "moti";
import { Menu, Search, Plus, X } from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from "../theme";
import { JournalCard } from "../components/journal/JournalCard";
import type { MainTabScreenProps } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTabBarVisibility } from "../context/TabBarContext";
import { listEntries, setFavorite, deleteEntry } from "../services/journal.service";
import type { JournalEntry } from "../types/models";
import { imageForEntry } from "../constants/moods";

const TABS = ["All Entries", "Favorites", "Monthly"];

/** Firestore Timestamp → JS Date, tolerating an unresolved server timestamp. */
function entryDate(entry: JournalEntry): Date {
  return entry.createdAt ? entry.createdAt.toDate() : new Date();
}

export function JournalListScreen(_props: MainTabScreenProps<"Journal">) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { onScroll } = useTabBarVisibility();
  const [activeTab, setActiveTab] = useState("All Entries");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const openEntry = (entry: JournalEntry) => {
    navigation.navigate("JournalEntryDetail", {
      entryId: entry.id,
      title: entry.title,
      body: entry.body,
      mood: entry.mood,
      createdAt: entryDate(entry).getTime(),
      isFavorite: entry.isFavorite,
    });
  };

  // Reload whenever the screen regains focus, so a newly-saved reflection
  // appears without needing a manual refresh.
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setEntries([]);
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      listEntries(user.uid)
        .then((result) => active && setEntries(result))
        .catch(() => active && setEntries([]))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user?.uid])
  );

  const toggleFavorite = (entry: JournalEntry) => {
    if (!user?.uid) return;
    const next = !entry.isFavorite;
    // Optimistic update; revert if the write fails.
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, isFavorite: next } : e))
    );
    showToast(next ? "Added to favorites" : "Removed from favorites");
    setFavorite(user.uid, entry.id, next).catch(() => {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, isFavorite: !next } : e))
      );
    });
  };

  const removeEntry = (entry: JournalEntry) => {
    if (!user?.uid) return;
    // Optimistic removal; reload to restore if the delete fails.
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    showToast("Reflection deleted");
    deleteEntry(user.uid, entry.id).catch(() => {
      if (user.uid) listEntries(user.uid).then(setEntries);
    });
  };

  // Long-press a card → action sheet (YouVersion-style), keeping the card clean.
  const openCardMenu = (entry: JournalEntry) => {
    Alert.alert(entry.title?.trim() || "Reflection", undefined, [
      {
        text: entry.isFavorite ? "Remove from favorites" : "Add to favorites",
        onPress: () => toggleFavorite(entry),
      },
      {
        text: "Delete entry",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete this reflection?", "This can't be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => removeEntry(entry),
            },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const now = new Date();
  const trimmedQuery = query.trim().toLowerCase();
  const filteredEntries = entries.filter((entry) => {
    if (activeTab === "Favorites" && !entry.isFavorite) return false;
    if (activeTab === "Monthly") {
      const d = entryDate(entry);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())
        return false;
    }
    if (trimmedQuery) {
      const haystack = `${entry.title ?? ""} ${entry.body}`.toLowerCase();
      if (!haystack.includes(trimmedQuery)) return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, spacing.lg) }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate("ConfessionList" as never)}>
            <Menu size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>My Journal</Text>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              setSearchOpen((open) => {
                if (open) setQuery("");
                return !open;
              });
            }}
          >
            {searchOpen ? (
              <X size={24} color={colors.primary} />
            ) : (
              <Search size={24} color={colors.primary} />
            )}
          </Pressable>
        </View>

        {searchOpen && (
          <View style={styles.searchRow}>
            <Search size={18} color={colors.primaryLight30} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reflections..."
              placeholderTextColor={colors.primaryLight30}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
          </View>
        )}

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable key={tab} style={[styles.tab, isActive && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.listContainer}
        >
          {filteredEntries.map((entry) => {
            const d = entryDate(entry);
            return (
              <JournalCard
                key={entry.id}
                id={entry.id}
                date={d.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
                previewText={entry.body}
                time={d.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                imageUrl={imageForEntry(entry.id, entry.mood)}
                isFavorite={entry.isFavorite}
                onPress={() => openEntry(entry)}
                onLongPress={() => openCardMenu(entry)}
                onToggleFavorite={() => toggleFavorite(entry)}
              />
            );
          })}
          {loading && filteredEntries.length === 0 && (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          {!loading && filteredEntries.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === "Favorites"
                  ? "No favorites yet. Tap the heart on an entry to save it."
                  : activeTab === "Monthly"
                    ? "No entries this month yet."
                    : "No reflections yet. Tap + to write your first one."}
              </Text>
            </View>
          )}
        </MotiView>
      </ScrollView>

      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={() => navigation.navigate("NewJournalEntry")}>
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
    backgroundColor: "rgba(248, 246, 242, 0.9)",
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
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
    color: "#94A3B8",
  },
  activeTabText: {
    fontWeight: "600",
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120,
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
    bottom: 100,
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
