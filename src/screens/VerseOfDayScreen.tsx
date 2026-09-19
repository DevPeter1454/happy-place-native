import React from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { MotiView } from "moti";
import {
  ChevronLeft,
  BookOpenText,
  Check,
  CheckCircle2,
  BookOpen,
  RefreshCw,
} from "lucide-react-native";
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
import { addActivity, listActivities } from "../services/activities.service";
import { dateKey, getDailyReading } from "../services/bible.service";
import type { DailyReading } from "../types/models";
import type { RootStackScreenProps } from "../navigation/types";

/** e.g. "Friday, 19 September" — the date this verse belongs to. */
function formatDay(d: Date): string {
  return d.toLocaleDateString("default", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Resolve the `date` param ("YYYY-MM-DD") to a local Date, falling back to today
 * for a missing or unparseable value. Never resolves to the future — there is no
 * verse to show for a day that hasn't happened.
 */
function resolveDate(param?: string): Date {
  if (!param) return new Date();
  const parsed = new Date(`${param}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return new Date();
  const now = new Date();
  return parsed > now ? now : parsed;
}

/**
 * The verse of the day on its own, so it can be read and sat with rather than
 * being skipped past inside a full chapter.
 *
 * Marking it read logs a `bible_reading` activity — the same thing the reader's
 * "Mark as Read" does — so the Home dashboard's Bible task, the reader and this
 * screen all agree on whether today is done.
 */
export function VerseOfDayScreen({
  navigation,
  route,
}: RootStackScreenProps<"VerseOfDay">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();

  const date = React.useMemo(
    () => resolveDate(route.params?.date),
    [route.params?.date],
  );
  const isToday = dateKey(date) === dateKey(new Date());

  const [reading, setReading] = React.useState<DailyReading | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [readOnDate, setReadOnDate] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // getDailyReading is memoised and cached per date, so arriving from the
  // dashboard (which has already loaded today) resolves immediately and offline.
  // A past day not read before is fetched once, then cached like any other.
  const load = React.useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setReading(await getDailyReading(date));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Any Bible reading logged on the shown day counts, matching the reader's rule.
  useFocusEffect(
    React.useCallback(() => {
      if (!user?.uid) return;
      let active = true;
      const key = dateKey(date);
      listActivities(user.uid, "bible_reading")
        .then((acts) => {
          if (!active) return;
          setReadOnDate(
            acts.some((a) => {
              const d = a.date?.toDate?.();
              return !!d && dateKey(d) === key;
            }),
          );
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.uid, date]),
  );

  const handleMarkRead = async () => {
    if (saving || readOnDate || !reading || !isToday) return;
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to track your reading.");
      return;
    }
    setSaving(true);
    setReadOnDate(true);
    showToast("Marked as read 📖");
    try {
      await addActivity(user.uid, {
        type: "bible_reading",
        notes: reading.votd.reference,
      });
    } catch {
      setReadOnDate(false);
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Navigating to Main pops this screen and lands on the Bible tab, positioned
  // on the verse's chapter.
  const readChapter = () => {
    if (!reading) return;
    navigation.navigate("Main", {
      screen: "Bible",
      params: { ref: reading.reference },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Verse of the Day</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : failed || !reading ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>
            Today's verse couldn't be loaded. Check your connection and try
            again.
          </Text>
          <Pressable
            onPress={load}
            style={({ pressed }) => [
              styles.retryBtn,
              pressed && styles.dim,
            ]}
          >
            <RefreshCw size={16} color={colors.primary} />
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
              style={styles.verseCard}
            >
              <View style={styles.badge}>
                <BookOpenText size={14} color={colors.primary} />
                <Text style={styles.badgeText}>VERSE OF THE DAY</Text>
              </View>
              <Text style={styles.date}>{formatDay(date)}</Text>

              <Text style={styles.verseText}>“{reading.votd.text}”</Text>

              <View style={styles.rule} />
              <Text style={styles.reference}>{reading.votd.reference}</Text>
              <Text style={styles.translation}>{reading.translationName}</Text>
            </MotiView>
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            {readOnDate ? (
              <View style={[styles.primaryBtn, styles.doneBtn]}>
                <CheckCircle2 size={20} color={colors.success} />
                <Text style={[styles.primaryBtnText, styles.doneBtnText]}>
                  {isToday ? "Read Today" : "You read this day"}
                </Text>
              </View>
            ) : isToday ? (
              <Pressable
                onPress={handleMarkRead}
                disabled={saving}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryBtnPressed,
                  saving && styles.dim,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Check size={20} color={colors.white} />
                    <Text style={styles.primaryBtnText}>Mark as Read</Text>
                  </>
                )}
              </Pressable>
            ) : null}

            <Pressable
              onPress={readChapter}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.dim,
              ]}
            >
              <BookOpen size={18} color={colors.primary} />
              <Text style={styles.secondaryBtnText}>
                Read {reading.reference}
              </Text>
            </Pressable>
          </View>
        </>
      )}
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
  },
  verseCard: {
    backgroundColor: colors.white,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    ...shadows.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
  },
  badgeText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
  },
  date: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  verseText: {
    fontFamily: fontFamilies.serifItalic,
    fontSize: fontSizes["2xl"],
    lineHeight: 40,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  rule: {
    width: 48,
    height: 2,
    borderRadius: radii.full,
    backgroundColor: colors.primaryGold,
    marginTop: spacing.xl,
  },
  reference: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.lg,
  },
  translation: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textPlaceholder,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight05,
    backgroundColor: colors.background,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    ...shadows.lg,
  },
  primaryBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  doneBtn: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    shadowOpacity: 0,
    elevation: 0,
  },
  doneBtnText: {
    color: colors.success,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryLight30,
  },
  secondaryBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
  dim: {
    opacity: 0.7,
  },
  stateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.primaryLight30,
  },
  retryText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
});
