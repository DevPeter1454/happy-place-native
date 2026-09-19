import React, { useEffect, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { MotiView } from "moti";
import { ChevronLeft, CheckCircle2, Plus, Sparkles } from "lucide-react-native";
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
import {
  listActivities,
  deleteActivity,
  setActivityAnswered,
  setActivityCompleted,
} from "../services/activities.service";
import { cacheKeys } from "../services/cache";
import { useCachedData } from "../hooks/useCachedData";
import type { SpiritualActivity } from "../types/models";

interface PrayerView {
  id: string;
  text: string;
  date: Date;
  prayed: boolean;
  /** When this prayer was answered, or null while still being prayed. */
  answeredAt: Date | null;
}

function toPrayer(a: SpiritualActivity): PrayerView {
  return {
    id: a.id,
    text: (a.notes ?? "").trim() || "(No text)",
    date: a.date ? a.date.toDate() : new Date(),
    prayed: !!a.completed,
    answeredAt: a.answeredAt ? a.answeredAt.toDate() : null,
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Shorter form for the answered badge, where the year is usually noise. */
function formatShortDate(d: Date): string {
  return d.toLocaleDateString("default", { month: "short", day: "numeric" });
}

type Filter = "All" | "Praying" | "Answered";

const FILTERS: Filter[] = ["All", "Praying", "Answered"];

export function PrayerListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const uid = user?.uid;
  const { data, loading, refresh, mutate } = useCachedData(
    uid ? cacheKeys.prayers(uid) : null,
    () =>
      listActivities(uid!, "prayer").then((r) =>
        // Only prayers that carry text are shown; blank streak ticks are ignored.
        r.filter((a) => a.notes?.trim()).map(toPrayer),
      ),
  );

  const allPrayers = data ?? [];
  const [filter, setFilter] = useState<Filter>("All");

  const answeredCount = allPrayers.filter((p) => p.answeredAt).length;
  const counts: Record<Filter, number> = {
    All: allPrayers.length,
    Praying: allPrayers.length - answeredCount,
    Answered: answeredCount,
  };
  const prayers = allPrayers.filter((p) =>
    filter === "Answered"
      ? !!p.answeredAt
      : filter === "Praying"
        ? !p.answeredAt
        : true,
  );

  /**
   * Marking answered is optimistic like the other toggles. The local date is set
   * to now; the server stamps its own, which the next refresh picks up — close
   * enough that the badge never shows a wrong day.
   */
  const toggleAnswered = (item: PrayerView) => {
    if (!user?.uid) return;
    const next = item.answeredAt ? null : new Date();
    mutate((prev) =>
      (prev ?? []).map((p) =>
        p.id === item.id ? { ...p, answeredAt: next } : p,
      ),
    );
    showToast(next ? "Answered — praise God 🙌" : "Moved back to praying");
    setActivityAnswered(user.uid, item.id, !!next).catch(() => {
      mutate((prev) =>
        (prev ?? []).map((p) =>
          p.id === item.id ? { ...p, answeredAt: item.answeredAt } : p,
        ),
      );
      Alert.alert("Couldn't save", "Please try again.");
    });
  };

  const togglePrayed = (item: PrayerView) => {
    if (!user?.uid) return;
    const next = !item.prayed;
    mutate((prev) =>
      (prev ?? []).map((p) => (p.id === item.id ? { ...p, prayed: next } : p)),
    );
    showToast(next ? "Marked as prayed 🙏" : "Marked unprayed");
    setActivityCompleted(user.uid, item.id, next).catch(() => {
      mutate((prev) =>
        (prev ?? []).map((p) => (p.id === item.id ? { ...p, prayed: !next } : p)),
      );
    });
  };

  const confirmDelete = (item: PrayerView) => {
    Alert.alert("Delete prayer", `"${item.text}"`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (!user?.uid) return;
          mutate((prev) => (prev ?? []).filter((p) => p.id !== item.id));
          showToast("Prayer deleted");
          deleteActivity(user.uid, item.id).catch(refresh);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}
      >
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Prayers</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterText, isActive && styles.filterTextActive]}
              >
                {f}
                {counts[f] > 0 ? ` ${counts[f]}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {prayers.map((item, index) => (
          <MotiView
            key={item.id}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: index * 60 }}
            style={[styles.card, item.answeredAt && styles.cardAnswered]}
          >
            <Pressable onLongPress={() => confirmDelete(item)} delayLongPress={300}>
              {item.answeredAt ? (
                <View style={styles.answeredBadge}>
                  <Sparkles size={14} color={colors.success} />
                  <Text style={styles.answeredBadgeText}>
                    ANSWERED · {formatShortDate(item.answeredAt)}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.cardText}>{item.text}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                <View style={styles.cardActions}>
                  <Pressable
                    style={[
                      styles.pillButton,
                      item.prayed && styles.prayedButtonActive,
                    ]}
                    onPress={() => togglePrayed(item)}
                  >
                    <CheckCircle2
                      size={16}
                      color={item.prayed ? colors.white : colors.primary}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        item.prayed && styles.prayedTextActive,
                      ]}
                    >
                      {item.prayed ? "Prayed" : "Mark Prayed"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.pillButton,
                      !!item.answeredAt && styles.answeredButtonActive,
                    ]}
                    onPress={() => toggleAnswered(item)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      item.answeredAt
                        ? "Move back to praying"
                        : "Mark as answered"
                    }
                  >
                    <Sparkles
                      size={16}
                      color={item.answeredAt ? colors.white : colors.primary}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        !!item.answeredAt && styles.prayedTextActive,
                      ]}
                    >
                      Answered
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </MotiView>
        ))}

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {!loading && prayers.length === 0 && (
          <View style={styles.stateBox}>
            <Text style={styles.emptyText}>
              {filter === "Answered"
                ? "No answered prayers yet. Mark one answered and it'll be kept here to look back on."
                : filter === "Praying"
                  ? "Nothing outstanding — every prayer here has been answered."
                  : "No prayers yet. Tap + to write your first one."}
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate("AddPrayer")}
      >
        <Plus size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.05)",
    ...shadows.sm,
  },
  cardText: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDate: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(138, 110, 71, 0.05)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  prayedButtonActive: { backgroundColor: colors.primary },
  answeredButtonActive: { backgroundColor: colors.success },
  pillText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
  },
  prayedTextActive: { color: colors.white },

  // Answered prayers stay in the list as a record, marked out from the rest.
  cardAnswered: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  answeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  answeredBadgeText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 1,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primaryLight30,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  filterTextActive: { color: colors.white },
  stateBox: { paddingVertical: spacing["3xl"], alignItems: "center" },
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
