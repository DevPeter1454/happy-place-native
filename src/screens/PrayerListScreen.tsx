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
import { MotiView } from "moti";
import { ChevronLeft, CheckCircle2, Plus } from "lucide-react-native";
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
  setActivityCompleted,
} from "../services/activities.service";
import type { SpiritualActivity } from "../types/models";
import { AddPrayerModal } from "../components/prayer/AddPrayerModal";

interface PrayerView {
  id: string;
  text: string;
  date: Date;
  prayed: boolean;
}

function toPrayer(a: SpiritualActivity): PrayerView {
  return {
    id: a.id,
    text: (a.notes ?? "").trim() || "(No text)",
    date: a.date ? a.date.toDate() : new Date(),
    prayed: !!a.completed,
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PrayerListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [prayers, setPrayers] = useState<PrayerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const reload = useCallback(() => {
    if (!user?.uid) {
      setPrayers([]);
      setLoading(false);
      return;
    }
    listActivities(user.uid, "prayer")
      // Only prayers that carry text are shown; blank streak ticks are ignored.
      .then((r) => setPrayers(r.filter((a) => a.notes?.trim()).map(toPrayer)))
      .catch(() => setPrayers([]))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      reload();
    }, [reload]),
  );

  const togglePrayed = (item: PrayerView) => {
    if (!user?.uid) return;
    const next = !item.prayed;
    setPrayers((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, prayed: next } : p)),
    );
    showToast(next ? "Marked as prayed 🙏" : "Marked unprayed");
    setActivityCompleted(user.uid, item.id, next).catch(() => {
      setPrayers((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, prayed: !next } : p)),
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
          setPrayers((prev) => prev.filter((p) => p.id !== item.id));
          showToast("Prayer deleted");
          deleteActivity(user.uid, item.id).catch(reload);
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
            style={styles.card}
          >
            <Pressable onLongPress={() => confirmDelete(item)} delayLongPress={300}>
              <Text style={styles.cardText}>{item.text}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                <Pressable
                  style={[
                    styles.prayedButton,
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
                      styles.prayedText,
                      item.prayed && styles.prayedTextActive,
                    ]}
                  >
                    {item.prayed ? "Prayed" : "Mark Prayed"}
                  </Text>
                </Pressable>
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
              No prayers yet. Tap + to add a prayer and mark it as prayed as God
              answers.
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => setAddOpen(true)}
      >
        <Plus size={28} color={colors.white} />
      </Pressable>

      <AddPrayerModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={reload}
      />
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
  prayedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(138, 110, 71, 0.05)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  prayedButtonActive: { backgroundColor: colors.primary },
  prayedText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  prayedTextActive: { color: colors.white },
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
