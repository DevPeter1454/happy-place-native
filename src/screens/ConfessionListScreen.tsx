import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { ChevronLeft, CheckCircle2, Plus } from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  listActivities,
  deleteActivity,
  setActivityCompleted,
} from "../services/activities.service";
import type { SpiritualActivity } from "../types/models";
import { imageForEntry } from "../constants/moods";

interface ConfessionView {
  id: string;
  text: string;
  verse?: string;
  image: string;
  date: Date;
  completed: boolean;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Confessions are stored as `confession` activities whose `notes` hold the
 * affirmation text and (optionally) a scripture reference, separated by a
 * blank line — the format written by AddConfessionScreen.
 */
function toConfession(activity: SpiritualActivity): ConfessionView {
  const notes = activity.notes ?? "";
  const [text, ...rest] = notes.split("\n\n");
  const verse = rest.join("\n\n").trim();
  return {
    id: activity.id,
    text: text.trim() || "(No text)",
    verse: verse || undefined,
    image: imageForEntry(activity.id),
    date: activity.date ? activity.date.toDate() : new Date(),
    completed: !!activity.completed,
  };
}

export function ConfessionListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [confessions, setConfessions] = useState<ConfessionView[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setConfessions([]);
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      listActivities(user.uid, "confession")
        .then((result) => active && setConfessions(result.map(toConfession)))
        .catch(() => active && setConfessions([]))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user?.uid])
  );

  const toggleCompleted = (item: ConfessionView) => {
    if (!user?.uid) return;
    const next = !item.completed;
    // Optimistic update, then persist; revert on failure.
    setConfessions((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, completed: next } : c))
    );
    setActivityCompleted(user.uid, item.id, next).catch(() => {
      setConfessions((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, completed: !next } : c))
      );
    });
  };

  const confirmDelete = (item: ConfessionView) => {
    Alert.alert("Delete confession", `"${item.text}"`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (!user?.uid) return;
          // Optimistic removal; reload to restore on failure.
          setConfessions((prev) => prev.filter((c) => c.id !== item.id));
          showToast("Confession deleted");
          deleteActivity(user.uid, item.id).catch(() => {
            if (user.uid) {
              listActivities(user.uid, "confession").then((r) =>
                setConfessions(r.map(toConfession))
              );
            }
          });
        },
      },
    ]);
  };

  // The confession that fulfilled today's dashboard task is the earliest one
  // created today; it shows as completed automatically (and can't be un-marked),
  // mirroring the daily progress. Confessions are sorted newest-first, so the
  // last of today's entries is the earliest.
  const now = new Date();
  const todays = confessions.filter((c) => isSameDay(c.date, now));
  const taskConfessionId = todays.length ? todays[todays.length - 1].id : undefined;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Confessions</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Affirmations</Text>
          <Text style={styles.sectionSubtitle}>Speak these truths over your life today</Text>
        </View>

        {confessions.map((item, index) => {
          // Auto-completed when it's today's task confession; otherwise manual.
          const isAuto = item.id === taskConfessionId;
          const isDone = isAuto || item.completed;
          return (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500, delay: index * 100 }}
              style={styles.card}
            >
              {/* Long-press the card to delete (YouVersion-style action). */}
              <Pressable
                onLongPress={() => confirmDelete(item)}
                delayLongPress={300}
              >
                <View style={styles.cardMain}>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardText}>{item.text}</Text>
                    {!!item.verse && (
                      <Text style={styles.cardVerse}>{item.verse}</Text>
                    )}
                  </View>
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    style={[
                      styles.completeButton,
                      isDone && styles.completeButtonActive,
                    ]}
                    onPress={() => toggleCompleted(item)}
                    disabled={isAuto}
                  >
                    <CheckCircle2
                      size={18}
                      color={isDone ? colors.white : colors.primary}
                    />
                    <Text
                      style={[
                        styles.completeButtonText,
                        isDone && styles.completeButtonTextActive,
                      ]}
                    >
                      {isAuto
                        ? "Completed today"
                        : isDone
                          ? "Completed"
                          : "Mark Completed"}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </MotiView>
          );
        })}

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {!loading && confessions.length === 0 && (
          <View style={styles.stateBox}>
            <Text style={styles.emptyText}>
              No confessions yet. Tap + to add an affirmation to speak over your
              life.
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable 
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => navigation.navigate("AddConfession" as never)}
      >
        <Plus size={28} color={colors.white} />
      </Pressable>
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
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
    opacity: 0.7,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.05)",
    ...shadows.sm,
  },
  cardMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 24,
    marginBottom: 4,
  },
  cardVerse: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: "600",
    opacity: 0.6,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(138, 110, 71, 0.05)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  completeButtonActive: {
    backgroundColor: colors.primary,
  },
  completeButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  completeButtonTextActive: {
    color: colors.white,
  },
  stateBox: {
    paddingVertical: spacing["3xl"],
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
});
