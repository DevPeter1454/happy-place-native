import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronLeft } from "lucide-react-native";
import { BIBLE_BOOKS, type BibleBook } from "../../constants/bibleBooks";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
} from "../../theme";

interface Props {
  visible: boolean;
  currentBook: string | null;
  onClose: () => void;
  onSelect: (book: string, chapter: number) => void;
}

/** Two-step picker: choose a book (grouped OT/NT), then a chapter. */
export function BookChapterPicker({
  visible,
  currentBook,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const [pickingChaptersFor, setPickingChaptersFor] = useState<BibleBook | null>(
    null,
  );

  const close = () => {
    setPickingChaptersFor(null);
    onClose();
  };

  const ot = BIBLE_BOOKS.filter((b) => b.testament === "OT");
  const nt = BIBLE_BOOKS.filter((b) => b.testament === "NT");

  const renderBooks = (title: string, books: BibleBook[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.bookGrid}>
        {books.map((b) => (
          <Pressable
            key={b.name}
            onPress={() => setPickingChaptersFor(b)}
            style={({ pressed }) => [
              styles.bookChip,
              b.name === currentBook && styles.bookChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.bookChipText,
                b.name === currentBook && styles.bookChipTextActive,
              ]}
            >
              {b.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingTop: Math.max(insets.top, spacing.lg) }]}>
          {/* Header */}
          <View style={styles.header}>
            {pickingChaptersFor ? (
              <Pressable
                onPress={() => setPickingChaptersFor(null)}
                style={styles.headerBtn}
              >
                <ChevronLeft size={24} color={colors.primary} />
              </Pressable>
            ) : (
              <View style={styles.headerBtn} />
            )}
            <Text style={styles.headerTitle}>
              {pickingChaptersFor ? pickingChaptersFor.name : "Books"}
            </Text>
            <Pressable onPress={close} style={styles.headerBtn}>
              <X size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: spacing.xl,
              paddingBottom: Math.max(insets.bottom, spacing.xl),
            }}
            showsVerticalScrollIndicator={false}
          >
            {pickingChaptersFor ? (
              <View style={styles.chapterGrid}>
                {Array.from(
                  { length: pickingChaptersFor.chapters },
                  (_, i) => i + 1,
                ).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      onSelect(pickingChaptersFor.name, c);
                      setPickingChaptersFor(null);
                    }}
                    style={({ pressed }) => [
                      styles.chapterCell,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.chapterText}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <>
                {renderBooks("Old Testament", ot)}
                {renderBooks("New Testament", nt)}
              </>
            )}
          </ScrollView>
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
    maxHeight: "88%",
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  bookChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  bookChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bookChipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  bookChipTextActive: {
    color: colors.white,
  },
  chapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chapterCell: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterText: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.6,
  },
});
