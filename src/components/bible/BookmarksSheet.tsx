import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Bookmark } from "lucide-react-native";
import {
  BIBLE_BOOKS,
  parsePassageRef,
} from "../../constants/bibleBooks";
import { colors, fontFamilies, fontSizes, spacing, radii } from "../../theme";
import type { VerseAnnotation } from "../../types/models";

interface Props {
  visible: boolean;
  loading: boolean;
  bookmarks: VerseAnnotation[];
  onClose: () => void;
  onSelect: (book: string, chapter: number) => void;
}

interface Group {
  reference: string;
  book: string;
  chapter: number;
  verses: number[];
  order: number;
}

const BOOK_INDEX = new Map(BIBLE_BOOKS.map((b, i) => [b.name, i]));

/** Group bookmarks by passage and sort in canonical Bible order. */
function groupBookmarks(bookmarks: VerseAnnotation[]): Group[] {
  const map = new Map<string, Group>();
  for (const b of bookmarks) {
    const parsed = parsePassageRef(b.reference);
    if (!parsed) continue;
    const existing = map.get(b.reference);
    if (existing) {
      existing.verses.push(b.verse);
    } else {
      map.set(b.reference, {
        reference: b.reference,
        book: parsed.book,
        chapter: parsed.chapter,
        verses: [b.verse],
        order: (BOOK_INDEX.get(parsed.book) ?? 999) * 1000 + parsed.chapter,
      });
    }
  }
  const groups = [...map.values()];
  groups.sort((a, b) => a.order - b.order);
  for (const g of groups) g.verses.sort((a, b) => a - b);
  return groups;
}

export function BookmarksSheet({
  visible,
  loading,
  bookmarks,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const groups = groupBookmarks(bookmarks);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.sheet, { paddingTop: Math.max(insets.top, spacing.lg) }]}
        >
          <View style={styles.header}>
            <View style={styles.headerBtn} />
            <Text style={styles.headerTitle}>Bookmarks</Text>
            <Pressable onPress={onClose} style={styles.headerBtn}>
              <X size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.centered}>
              <Bookmark size={32} color={colors.primaryLight30} />
              <Text style={styles.emptyText}>
                No bookmarks yet. Select verses and tap the bookmark to save them.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{
                padding: spacing.xl,
                paddingBottom: Math.max(insets.bottom, spacing.xl),
                gap: spacing.md,
              }}
              showsVerticalScrollIndicator={false}
            >
              {groups.map((g) => (
                <Pressable
                  key={g.reference}
                  onPress={() => onSelect(g.book, g.chapter)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <Bookmark
                    size={18}
                    color={colors.primary}
                    fill={colors.primary}
                  />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardRef}>{g.reference}</Text>
                    <Text style={styles.cardVerses}>
                      {g.verses.length === 1
                        ? `Verse ${g.verses[0]}`
                        : `Verses ${g.verses.join(", ")}`}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  centered: {
    paddingVertical: spacing["2xl"] * 2,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardBody: {
    flex: 1,
  },
  cardRef: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardVerses: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
