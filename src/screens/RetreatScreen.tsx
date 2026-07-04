import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { Image } from "expo-image";
import { MotiView } from "moti";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar, Check, Leaf } from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import { useTabBarVisibility } from "../context/TabBarContext";
import { useAuth } from "../context/AuthContext";
import { dateKey } from "../services/bible.service";
import {
  getRetreat,
  startRetreat,
  clearRetreat,
} from "../services/retreat.service";
import { RETREAT_PLANS } from "../constants/retreatPlans";
import type { Retreat } from "../types/models";

const HERO_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA_U8VpNVd4BkrauPX4xBueFePJ-pI-3wyJvdN5imrJtiz_caBTfaWnlKhl8exx_9q3E8Ni_XQxITEnJZG6rE6ELveQ5gviWrTr4fC0rY36448TXlMdWVNOqkFxvcGiFVRjA9oPMBXF-5QthmnMHrSRQn80c8SnVPX7ayCu34HqFWR86-zJ2UeXSsSGObY6D53xYXSfzryXNJYN99NJIWNxiHpt7MixYAr-GzbXeIh8aAKEJuXOci1cDw2RI29aAoVHBPQOUF1XraRM";

const MS_PER_DAY = 86_400_000;

function daysInclusive(start: Date, end: Date): number {
  const a = new Date(`${dateKey(start)}T00:00:00`).getTime();
  const b = new Date(`${dateKey(end)}T00:00:00`).getTime();
  return Math.round((b - a) / MS_PER_DAY) + 1;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Current 1-based day of an active retreat (clamped into range). */
function currentDay(retreat: Retreat): number {
  const start = new Date(`${retreat.startDate}T00:00:00`).getTime();
  const today = new Date(`${dateKey(new Date())}T00:00:00`).getTime();
  const idx = Math.round((today - start) / MS_PER_DAY) + 1;
  return Math.min(Math.max(idx, 1), retreat.totalDays);
}

export function RetreatScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { onScroll } = useTabBarVisibility();
  const { user } = useAuth();

  const [retreat, setRetreat] = useState<Retreat | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [mode, setMode] = useState<"guided" | "custom">("guided");
  const [planId, setPlanId] = useState(RETREAT_PLANS[1].id); // default 7-day
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d;
  });
  const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(null);

  const reload = useCallback(() => {
    if (!user?.uid) {
      setRetreat(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getRetreat(user.uid)
      .then((r) => active && setRetreat(r))
      .catch(() => active && setRetreat(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user?.uid]);

  useFocusEffect(reload);

  const handleStart = async () => {
    if (starting || !user?.uid) {
      if (!user?.uid) Alert.alert("Not signed in", "Please sign in first.");
      return;
    }
    let cfg;
    if (mode === "guided") {
      const plan = RETREAT_PLANS.find((p) => p.id === planId);
      if (!plan) return;
      cfg = {
        kind: "guided" as const,
        planId: plan.id,
        title: plan.title,
        startDate: dateKey(new Date()),
        totalDays: plan.days,
      };
    } else {
      const total = daysInclusive(startDate, endDate);
      if (total < 1) {
        Alert.alert("Invalid dates", "The end date must be after the start.");
        return;
      }
      cfg = {
        kind: "custom" as const,
        title: "Personal Retreat",
        startDate: dateKey(startDate),
        totalDays: total,
      };
    }
    setStarting(true);
    try {
      await startRetreat(user.uid, cfg);
      navigation.navigate("RetreatDashboard");
    } catch {
      Alert.alert("Couldn't start", "Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = () => {
    if (!user?.uid) return;
    Alert.alert("End retreat?", "This will clear your current retreat.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => {
          clearRetreat(user.uid).then(() => setRetreat(null));
        },
      },
    ]);
  };

  const onPickDate = (event: DateTimePickerEvent, date?: Date) => {
    // Android reports the result here and dismisses itself.
    if (Platform.OS === "android") setPickerTarget(null);
    if (event.type === "dismissed" || !date) return;
    if (pickerTarget === "start") {
      setStartDate(date);
      if (date > endDate) setEndDate(date);
    } else if (pickerTarget === "end") {
      setEndDate(date);
    }
  };

  const customDays = daysInclusive(startDate, endDate);

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}
      >
        <Text style={styles.headerTitle}>Spiritual Retreat</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 100) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
          >
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: HERO_URI }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
            </View>

            {retreat && !retreat.completedAt ? (
              /* ---- Active retreat summary ---- */
              <View style={styles.activeSection}>
                <View style={styles.activeCard}>
                  <View style={styles.activeIcon}>
                    <Leaf size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.activeTitle}>{retreat.title}</Text>
                  <Text style={styles.activeSubtitle}>
                    Day {currentDay(retreat)} of {retreat.totalDays}
                  </Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate("RetreatDashboard")}
                  style={({ pressed }) => [
                    styles.ctaButton,
                    pressed && styles.ctaButtonPressed,
                  ]}
                >
                  <Text style={styles.ctaText}>Continue Retreat</Text>
                </Pressable>
                <Pressable
                  onPress={handleEnd}
                  style={({ pressed }) => [
                    styles.endButton,
                    pressed && styles.pressedDim,
                  ]}
                >
                  <Text style={styles.endText}>End Retreat</Text>
                </Pressable>
              </View>
            ) : (
              /* ---- Setup ---- */
              <>
                <View style={styles.copySection}>
                  <Text style={styles.copyTitle}>Set Your Intentions</Text>
                  <Text style={styles.copySubtitle}>
                    Carve out time for deep reflection. Disconnect to reconnect
                    with your spiritual journey.
                  </Text>
                </View>

                {/* Mode toggle */}
                <View style={styles.segment}>
                  {(["guided", "custom"] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setMode(m)}
                      style={[
                        styles.segmentBtn,
                        mode === m && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          mode === m && styles.segmentTextActive,
                        ]}
                      >
                        {m === "guided" ? "Guided Plan" : "Custom Dates"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {mode === "guided" ? (
                  <View style={styles.formSection}>
                    {RETREAT_PLANS.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => setPlanId(p.id)}
                        style={({ pressed }) => [
                          styles.planCard,
                          planId === p.id && styles.planCardActive,
                          pressed && styles.pressedDim,
                        ]}
                      >
                        <View style={styles.planBody}>
                          <Text style={styles.planTitle}>{p.title}</Text>
                          <Text style={styles.planSubtitle}>{p.subtitle}</Text>
                        </View>
                        <View
                          style={[
                            styles.radio,
                            planId === p.id && styles.radioActive,
                          ]}
                        >
                          {planId === p.id ? (
                            <Check size={14} color={colors.white} strokeWidth={3} />
                          ) : null}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.formSection}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Start Date</Text>
                      <Pressable
                        onPress={() => setPickerTarget("start")}
                        style={styles.inputWrapper}
                      >
                        <Text style={styles.inputText}>
                          {formatDate(startDate)}
                        </Text>
                        <Calendar size={20} color="rgba(138, 110, 71, 0.6)" />
                      </Pressable>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>End Date</Text>
                      <Pressable
                        onPress={() => setPickerTarget("end")}
                        style={styles.inputWrapper}
                      >
                        <Text style={styles.inputText}>
                          {formatDate(endDate)}
                        </Text>
                        <Calendar size={20} color="rgba(138, 110, 71, 0.6)" />
                      </Pressable>
                    </View>
                    <Text style={styles.durationNote}>
                      {customDays} day{customDays === 1 ? "" : "s"} · reflection
                      every day
                    </Text>
                  </View>
                )}

                <Pressable
                  disabled={starting}
                  style={({ pressed }) => [
                    styles.ctaButton,
                    pressed && styles.ctaButtonPressed,
                    starting && styles.pressedDim,
                  ]}
                  onPress={handleStart}
                >
                  <Text style={styles.ctaText}>
                    {starting ? "Starting…" : "Start Retreat"}
                  </Text>
                </Pressable>
              </>
            )}
          </MotiView>
        </ScrollView>
      )}

      {/* Date picker (custom mode) */}
      {pickerTarget && Platform.OS === "android" ? (
        <DateTimePicker
          value={pickerTarget === "start" ? startDate : endDate}
          mode="date"
          onChange={onPickDate}
        />
      ) : null}
      {Platform.OS === "ios" ? (
        <Modal
          visible={pickerTarget !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerTarget(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerTarget(null)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>
                {pickerTarget === "start" ? "Start Date" : "End Date"}
              </Text>
              <DateTimePicker
                value={pickerTarget === "start" ? startDate : endDate}
                mode="date"
                display="spinner"
                onChange={onPickDate}
              />
              <Pressable
                onPress={() => setPickerTarget(null)}
                style={({ pressed }) => [
                  styles.modalDone,
                  pressed && styles.ctaButtonPressed,
                ]}
              >
                <Text style={styles.ctaText}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { flexGrow: 1 },
  heroContainer: { padding: spacing.md },
  heroImage: {
    width: "100%",
    minHeight: 220,
    borderRadius: radii.xl,
    backgroundColor: colors.primaryLight05,
  },
  copySection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  copyTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  copySubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },

  // Segmented toggle
  segment: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    backgroundColor: colors.primaryLight05,
    borderRadius: radii.full,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radii.full,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  segmentText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segmentTextActive: { color: colors.primary },

  formSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },

  // Guided plan cards
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  planCardActive: { borderColor: colors.primary },
  planBody: { flex: 1, marginRight: spacing.md },
  planTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  planSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  // Custom date inputs
  inputGroup: {},
  inputLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight05,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.2)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  inputText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  durationNote: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  // Active summary
  activeSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  activeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  activeIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  activeTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
  },
  activeSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  endButton: { alignItems: "center", paddingVertical: spacing.md },
  endText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // CTA
  ctaButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    shadowColor: colors.primary,
  },
  ctaButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  ctaText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  pressedDim: { opacity: 0.7 },

  // iOS date modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  modalTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  modalDone: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    marginTop: spacing.md,
  },
});
