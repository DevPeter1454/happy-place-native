import React, { useEffect, useRef, useState } from "react";
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
import { cacheKeys } from "../services/cache";
import { useCachedData } from "../hooks/useCachedData";
import type { SpiritualActivity } from "../types/models";
import { imageForEntry } from "../constants/moods";
import { parseConfession } from "../utils/confessions";
import type { RootStackScreenProps } from "../navigation/types";

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

/** The shared parse plus the decorative image this screen shows. */
function toConfession(activity: SpiritualActivity): ConfessionView {
  const parsed = parseConfession(activity);
  return { ...parsed, image: imageForEntry(activity.id) };
}

export function ConfessionListScreen({
  navigation,
  route,
}: RootStackScreenProps<"ConfessionList">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const uid = user?.uid;
  const { data, loading, refresh, mutate } = useCachedData(
    uid ? cacheKeys.confessions(uid) : null,
    () => listActivities(uid!, "confession").then((r) => r.map(toConfession))
  );

  const confessions = data ?? [];

  const toggleCompleted = (item: ConfessionView) => {
    if (!user?.uid) return;
    const next = !item.completed;
    // Optimistic update, then persist; revert on failure.
    mutate((prev) =>
      (prev ?? []).map((c) => (c.id === item.id ? { ...c, completed: next } : c))
    );
    setActivityCompleted(user.uid, item.id, next).catch(() => {
      mutate((prev) =>
        (prev ?? []).map((c) => (c.id === item.id ? { ...c, completed: !next } : c))
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
          mutate((prev) => (prev ?? []).filter((c) => c.id !== item.id));
          showToast("Confession deleted");
          deleteActivity(user.uid, item.id).catch(() => {
            refresh();
          });
        },
      },
    ]);
  };

  // Opening a specific confession (from the dashboard or the tracker): scroll it
  // into view once it has laid out, and emphasise it briefly so it's obvious
  // which one was meant.
  const highlightId = route.params?.highlightId;
  const scrollRef = useRef<ScrollView>(null);
  const [highlighted, setHighlighted] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!highlightId) return;
    setHighlighted(highlightId);
    const timer = setTimeout(() => {
      setHighlighted(undefined);
      // Clear the param so coming back to this screen doesn't scroll again.
      navigation.setParams({ highlightId: undefined });
    }, 2400);
    return () => clearTimeout(timer);
  }, [highlightId, navigation]);

  const scrollToHighlighted = (id: string, y: number) => {
    if (id !== highlightId) return;
    // A frame's grace so the scroll lands after layout settles.
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(y - spacing.xl, 0), animated: true }),
    );
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
        ref={scrollRef}
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
              onLayout={(e) => scrollToHighlighted(item.id, e.nativeEvent.layout.y)}
              style={[
                styles.card,
                highlighted === item.id && styles.cardHighlighted,
              ]}
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
        onPress={() => navigation.navigate("AddConfession")}
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
  cardHighlighted: {
    borderColor: colors.primaryGold,
    borderWidth: 2,
    ...shadows.md,
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
