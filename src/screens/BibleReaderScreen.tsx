import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  type RouteProp,
} from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../navigation/types";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Type,
  Bookmark,
  Check,
  Eraser,
  X,
} from "lucide-react-native";
import { MotiView } from "moti";
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
import { useTabBarVisibility } from "../context/TabBarContext";
import {
  fetchChapter,
  getStoredTranslation,
  setStoredTranslation,
  getDailyPassageRef,
  dateKey,
} from "../services/bible.service";
import {
  listVerseAnnotations,
  listBookmarkedVerses,
  setVersesHighlight,
  setVersesBookmark,
} from "../services/bibleAnnotations.service";
import { addActivity, listActivities } from "../services/activities.service";
import { HIGHLIGHT_COLORS, HIGHLIGHT_ORDER } from "../constants/highlightColors";
import {
  BIBLE_BOOKS,
  getBook,
  parsePassageRef,
  apiPassageRef,
} from "../constants/bibleBooks";
import { translationFor } from "../constants/bibleTranslations";
import { BookChapterPicker } from "../components/bible/BookChapterPicker";
import { TranslationPicker } from "../components/bible/TranslationPicker";
import { BookmarksSheet } from "../components/bible/BookmarksSheet";
import type {
  BibleVerse,
  HighlightColor,
  VerseAnnotation,
} from "../types/models";

const FONT_SCALE_KEY = "bible-font-scale";
const LAST_POS_KEY = "bible-last-position";
// Matches the floating tab bar height in MainTabNavigator.
const TAB_BAR_HEIGHT = 88;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.6;
const SCALE_STEP = 0.12;
const BASE_VERSE_SIZE = fontSizes.xl;
const BASE_VERSE_LINE = 32;

export function BibleReaderScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList, "Bible">>();
  const route = useRoute<RouteProp<MainTabParamList, "Bible">>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { onScroll } = useTabBarVisibility();

  const [book, setBook] = useState<string | null>(null);
  const [chapter, setChapter] = useState(1);
  const [translationId, setTranslationId] = useState("kjv");
  const [translationReady, setTranslationReady] = useState(false);

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [translationName, setTranslationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [doneToday, setDoneToday] = useState(false);

  const [annotations, setAnnotations] = useState<Map<number, VerseAnnotation>>(
    new Map(),
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [translationPickerOpen, setTranslationPickerOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<VerseAnnotation[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const reference = book ? `${book} ${chapter}` : "";

  // Load the saved translation once.
  useEffect(() => {
    let active = true;
    getStoredTranslation()
      .then((id) => {
        if (!active) return;
        setTranslationId(id);
        setTranslationReady(true);
      })
      .catch(() => active && setTranslationReady(true));
    return () => {
      active = false;
    };
  }, []);

  // Resolve which passage to show: a nav param wins (e.g. tapping the Verse of
  // the Day), otherwise the last-read position, otherwise today's reading.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const paramRef = route.params?.ref;
      if (paramRef) {
        const parsed = parsePassageRef(paramRef);
        if (parsed) {
          setBook(parsed.book);
          setChapter(parsed.chapter);
        }
        navigation.setParams({ ref: undefined });
        return;
      }
      if (book) return; // already positioned

      (async () => {
        let last: { book: string; chapter: number } | null = null;
        try {
          const raw = await AsyncStorage.getItem(LAST_POS_KEY);
          if (raw) last = JSON.parse(raw);
        } catch {
          last = null;
        }
        if (!active) return;
        if (last && getBook(last.book)) {
          setBook(last.book);
          setChapter(last.chapter);
          return;
        }
        const daily = parsePassageRef(getDailyPassageRef());
        setBook(daily?.book ?? "Genesis");
        setChapter(daily?.chapter ?? 1);
      })();

      return () => {
        active = false;
      };
    }, [route.params?.ref, book, navigation]),
  );

  // Fetch the current passage, falling back to KJV when the selected
  // translation doesn't include this book/chapter (some are partial).
  const reqId = useRef(0);
  const loadPassage = useCallback(async () => {
    if (!book) return;
    const id = ++reqId.current;
    const current = () => reqId.current === id;
    setLoading(true);
    setError(false);
    const apiRef = apiPassageRef(book, chapter);
    try {
      const res = await fetchChapter(apiRef, translationId);
      if (current()) {
        setVerses(res.verses);
        setTranslationName(res.translationName);
      }
    } catch {
      if (translationId !== "kjv") {
        try {
          const res = await fetchChapter(apiRef, "kjv");
          if (current()) {
            setVerses(res.verses);
            setTranslationName(res.translationName);
            showToast(
              `Not available in ${translationFor(translationId).abbr} — showing KJV`,
            );
          }
        } catch {
          if (current()) setError(true);
        }
      } else if (current()) {
        setError(true);
      }
    } finally {
      if (current()) setLoading(false);
    }
  }, [book, chapter, translationId, showToast]);

  useEffect(() => {
    if (translationReady) loadPassage();
  }, [loadPassage, translationReady]);

  // Persist last position and clear any selection when the passage changes.
  useEffect(() => {
    if (!book) return;
    AsyncStorage.setItem(
      LAST_POS_KEY,
      JSON.stringify({ book, chapter }),
    ).catch(() => {});
    setSelected(new Set());
  }, [book, chapter]);

  const reloadAnnotations = useCallback(() => {
    if (!user?.uid || !book) {
      setAnnotations(new Map());
      return;
    }
    listVerseAnnotations(user.uid, `${book} ${chapter}`)
      .then(setAnnotations)
      .catch(() => {});
  }, [user?.uid, book, chapter]);

  useFocusEffect(
    useCallback(() => {
      reloadAnnotations();
    }, [reloadAnnotations]),
  );

  // Whether any chapter has been marked read today.
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      let active = true;
      const todayKey = dateKey(new Date());
      listActivities(user.uid, "bible_reading")
        .then((acts) => {
          if (!active) return;
          setDoneToday(
            acts.some((a) => {
              const d = a.date?.toDate?.();
              return d && dateKey(d) === todayKey;
            }),
          );
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.uid]),
  );

  // Restore the saved font scale.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem(FONT_SCALE_KEY)
        .then((v) => {
          const n = v ? parseFloat(v) : NaN;
          if (active && Number.isFinite(n)) setFontScale(n);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  const changeScale = (dir: 1 | -1) => {
    setFontScale((prev) => {
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, prev + dir * SCALE_STEP),
      );
      AsyncStorage.setItem(FONT_SCALE_KEY, String(next)).catch(() => {});
      return next;
    });
  };

  const goChapter = (delta: 1 | -1) => {
    if (!book) return;
    const b = getBook(book);
    if (!b) return;
    const idx = BIBLE_BOOKS.indexOf(b);
    const c = chapter + delta;
    if (c < 1) {
      if (idx > 0) {
        const prev = BIBLE_BOOKS[idx - 1];
        setBook(prev.name);
        setChapter(prev.chapters);
      }
      return;
    }
    if (c > b.chapters) {
      if (idx < BIBLE_BOOKS.length - 1) {
        setBook(BIBLE_BOOKS[idx + 1].name);
        setChapter(1);
      }
      return;
    }
    setChapter(c);
  };

  const selectPassage = (b: string, c: number) => {
    setBookPickerOpen(false);
    setBook(b);
    setChapter(c);
  };

  const changeTranslation = (id: string) => {
    setTranslationPickerOpen(false);
    if (id === translationId) return;
    setTranslationId(id);
    setStoredTranslation(id).catch(() => {});
  };

  const openBookmarks = () => {
    setBookmarksOpen(true);
    if (!user?.uid) return;
    setBookmarksLoading(true);
    listBookmarkedVerses(user.uid)
      .then(setBookmarks)
      .catch(() => setBookmarks([]))
      .finally(() => setBookmarksLoading(false));
  };

  const toggleSelect = (verse: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(verse)) next.delete(verse);
      else next.add(verse);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const patchAnnotations = (
    verseNums: number[],
    patch: Partial<VerseAnnotation>,
  ) => {
    setAnnotations((prev) => {
      const next = new Map(prev);
      for (const verse of verseNums) {
        const cur = next.get(verse) ?? { reference, verse };
        next.set(verse, { ...cur, ...patch });
      }
      return next;
    });
  };

  const setHighlight = (color: HighlightColor | null) => {
    if (!user?.uid || !book || selected.size === 0) return;
    const verseNums = [...selected];
    patchAnnotations(verseNums, { highlight: color });
    showToast(color ? "Highlighted" : "Highlight removed");
    setVersesHighlight(user.uid, reference, verseNums, color).catch(
      reloadAnnotations,
    );
  };

  const commonHighlight: HighlightColor | null = (() => {
    const verseNums = [...selected];
    if (verseNums.length === 0) return null;
    const first = annotations.get(verseNums[0])?.highlight ?? null;
    return verseNums.every(
      (v) => (annotations.get(v)?.highlight ?? null) === first,
    )
      ? first
      : null;
  })();

  const toggleHighlight = (color: HighlightColor) => {
    setHighlight(commonHighlight === color ? null : color);
  };

  const anySelectedBookmarked = [...selected].some(
    (v) => annotations.get(v)?.bookmarked,
  );

  const toggleBookmarkSelected = () => {
    if (!user?.uid || !book || selected.size === 0) return;
    const verseNums = [...selected];
    const next = !anySelectedBookmarked;
    patchAnnotations(verseNums, { bookmarked: next });
    showToast(next ? "Bookmarked" : "Bookmark removed");
    setVersesBookmark(user.uid, reference, verseNums, next).catch(
      reloadAnnotations,
    );
  };

  const handleMarkRead = async () => {
    if (saving || doneToday || !book) return;
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to track your reading.");
      return;
    }
    setSaving(true);
    setDoneToday(true);
    showToast("Marked as read 📖");
    try {
      await addActivity(user.uid, { type: "bible_reading", notes: reference });
    } catch {
      setDoneToday(false);
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const verseSize = BASE_VERSE_SIZE * fontScale;
  const verseLine = BASE_VERSE_LINE * fontScale;
  const selecting = selected.size > 0;

  return (
    <View style={styles.container}>
      {/* Header: passage selector + bookmarks + translation */}
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}
      >
        <Pressable
          onPress={() => setBookPickerOpen(true)}
          style={({ pressed }) => [
            styles.passageBtn,
            pressed && styles.dim,
          ]}
        >
          <BookOpen size={18} color={colors.primary} />
          <Text style={styles.passageBtnText} numberOfLines={1}>
            {book ? `${book} ${chapter}` : "Bible"}
          </Text>
          <ChevronDown size={16} color={colors.primary} />
        </Pressable>

        <View style={styles.headerRight}>
          <Pressable
            onPress={openBookmarks}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.dim]}
          >
            <Bookmark size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => setTranslationPickerOpen(true)}
            style={({ pressed }) => [styles.translationChip, pressed && styles.dim]}
          >
            <Text style={styles.translationChipText}>
              {translationFor(translationId).abbr}
            </Text>
            <ChevronDown size={14} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Couldn't load this passage.</Text>
          <Pressable
            onPress={loadPassage}
            style={({ pressed }) => [styles.retryButton, pressed && styles.dim]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                Math.max(insets.bottom, 100) + (selecting ? 140 : 0),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            key={reference}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
          >
            {/* Chapter title + navigation */}
            <View style={styles.titleSection}>
              <View style={styles.chapterNav}>
                <Pressable
                  onPress={() => goChapter(-1)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.navBtn, pressed && styles.dim]}
                >
                  <ChevronLeft size={26} color={colors.primary} />
                </Pressable>
                <View style={styles.titleCenter}>
                  <Text style={styles.bookTitle}>{book}</Text>
                  <Text style={styles.chapterLabel}>Chapter {chapter}</Text>
                </View>
                <Pressable
                  onPress={() => goChapter(1)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.navBtn, pressed && styles.dim]}
                >
                  <ChevronRight size={26} color={colors.primary} />
                </Pressable>
              </View>
              <View style={styles.divider} />
              <Text style={styles.translationName}>{translationName}</Text>
            </View>

            {/* Scripture */}
            <View style={styles.scriptureContainer}>
              {verses.map((item) => {
                const ann = annotations.get(item.verse);
                const isSelected = selected.has(item.verse);
                const hl = ann?.highlight
                  ? HIGHLIGHT_COLORS[ann.highlight]
                  : null;
                return (
                  <Pressable
                    key={item.verse}
                    onPress={() => toggleSelect(item.verse)}
                    style={[
                      styles.verseRow,
                      hl && { backgroundColor: hl.bg },
                      isSelected && styles.verseRowSelected,
                    ]}
                  >
                    <View style={styles.verseNumberWrap}>
                      <Text style={styles.verseNumber}>{item.verse}</Text>
                      {ann?.bookmarked ? (
                        <Bookmark
                          size={11}
                          color={colors.primary}
                          fill={colors.primary}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.verseText,
                        { fontSize: verseSize, lineHeight: verseLine },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Reading controls */}
            <View style={styles.controlsRow}>
              <View style={styles.controlGroup}>
                <Pressable
                  onPress={() => changeScale(-1)}
                  style={styles.controlButton}
                >
                  <Type size={18} color={colors.textSecondary} />
                  <Text style={styles.controlLabel}>A-</Text>
                </Pressable>
                <Pressable
                  onPress={() => changeScale(1)}
                  style={styles.controlButton}
                >
                  <Type size={22} color={colors.textSecondary} />
                  <Text style={styles.controlLabel}>A+</Text>
                </Pressable>
              </View>
              <Text style={styles.controlHint}>
                Tap a verse to highlight or bookmark
              </Text>
            </View>

            {/* Mark as read */}
            <Pressable
              onPress={handleMarkRead}
              disabled={doneToday || saving}
              style={({ pressed }) => [
                styles.readButton,
                pressed && styles.readButtonPressed,
                (doneToday || saving) && styles.readButtonDisabled,
              ]}
            >
              {doneToday ? (
                <View style={styles.readButtonInner}>
                  <Check size={18} color={colors.white} />
                  <Text style={styles.readButtonText}>Read Today</Text>
                </View>
              ) : (
                <Text style={styles.readButtonText}>
                  {saving ? "Saving…" : "Mark as Read"}
                </Text>
              )}
            </Pressable>
          </MotiView>
        </ScrollView>
      )}

      {/* Selection action bar (YouVersion-style) */}
      {selecting ? (
        <View style={styles.selectionBar}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionCount}>
              {selected.size} verse{selected.size === 1 ? "" : "s"} selected
            </Text>
            <Pressable onPress={clearSelection} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.selectionActions}>
            {HIGHLIGHT_ORDER.map((c) => (
              <Pressable
                key={c}
                onPress={() => toggleHighlight(c)}
                style={({ pressed }) => [
                  styles.swatch,
                  {
                    backgroundColor: HIGHLIGHT_COLORS[c].bg,
                    borderColor:
                      commonHighlight === c
                        ? colors.primary
                        : HIGHLIGHT_COLORS[c].border,
                  },
                  commonHighlight === c && styles.swatchActive,
                  pressed && styles.swatchPressed,
                ]}
              >
                {commonHighlight === c ? (
                  <Check size={16} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
            <Pressable
              onPress={() => setHighlight(null)}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <Eraser size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={toggleBookmarkSelected}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <Bookmark
                size={18}
                color={colors.primary}
                fill={anySelectedBookmarked ? colors.primary : "transparent"}
              />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Modals */}
      <BookChapterPicker
        visible={bookPickerOpen}
        currentBook={book}
        onClose={() => setBookPickerOpen(false)}
        onSelect={selectPassage}
      />
      <TranslationPicker
        visible={translationPickerOpen}
        currentId={translationId}
        onClose={() => setTranslationPickerOpen(false)}
        onSelect={changeTranslation}
      />
      <BookmarksSheet
        visible={bookmarksOpen}
        loading={bookmarksLoading}
        bookmarks={bookmarks}
        onClose={() => setBookmarksOpen(false)}
        onSelect={(b, c) => {
          setBookmarksOpen(false);
          setBook(b);
          setChapter(c);
        }}
      />
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
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
    backgroundColor: "rgba(248, 246, 242, 0.8)",
  },
  passageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  passageBtnText: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  translationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
  },
  translationChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  dim: {
    opacity: 0.6,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
  },
  retryText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  chapterNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCenter: {
    flex: 1,
    alignItems: "center",
  },
  bookTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 40,
    fontWeight: "700",
    fontStyle: "italic",
    color: colors.textPrimary,
    textAlign: "center",
  },
  chapterLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  divider: {
    width: 48,
    height: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.full,
    marginTop: spacing.md,
  },
  translationName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textPlaceholder,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  scriptureContainer: {
    marginBottom: spacing["2xl"],
  },
  verseRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: 6,
    borderRadius: radii.sm,
    borderBottomWidth: 2,
    borderStyle: "dotted",
    borderColor: "transparent",
  },
  verseRowSelected: {
    borderColor: colors.primary,
  },
  verseNumberWrap: {
    width: 30,
    marginRight: spacing.sm,
    alignItems: "center",
  },
  verseNumber: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes["3xl"],
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
    lineHeight: 32,
  },
  verseText: {
    flex: 1,
    fontFamily: fontFamilies.serif,
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
  controlHint: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    color: colors.textPlaceholder,
    textAlign: "right",
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
  readButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  readButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  readButtonDisabled: {
    opacity: 0.6,
  },
  readButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.white,
  },

  // Selection action bar
  selectionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TAB_BAR_HEIGHT,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight05,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    ...shadows.lg,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectionCount: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchActive: {
    transform: [{ scale: 1.1 }],
  },
  swatchPressed: {
    transform: [{ scale: 0.9 }],
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
});
