import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { TRANSLATIONS } from "../../constants/bibleTranslations";
import { colors, fontFamilies, fontSizes, spacing, radii } from "../../theme";

interface Props {
  visible: boolean;
  currentId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function TranslationPicker({
  visible,
  currentId,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) },
          ]}
          onPress={() => {}}
        >
          <Text style={styles.title}>Translation</Text>
          {TRANSLATIONS.map((t) => {
            const active = t.id === currentId;
            return (
              <Pressable
                key={t.id}
                onPress={() => onSelect(t.id)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                <View>
                  <Text style={styles.rowName}>{t.name}</Text>
                  <Text style={styles.rowAbbr}>{t.abbr}</Text>
                </View>
                {active ? <Check size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
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
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowName: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowAbbr: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
