import React from "react";
import { View, Text, Modal, Platform, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  radii,
  spacing,
  shadows,
} from "../../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromLibrary: () => void;
  /** Omitted when the user has no picture to remove. */
  onRemovePhoto?: () => void;
}

/**
 * Bottom sheet asking where a profile picture should come from. A custom sheet
 * (rather than ActionSheetIOS) so Android and iOS look the same and it can carry
 * the app's styling.
 */
export function PhotoSourceSheet({
  visible,
  onClose,
  onTakePhoto,
  onChooseFromLibrary,
  onRemovePhoto,
}: Props) {
  const insets = useSafeAreaInsets();
  const pending = React.useRef<(() => void) | null>(null);

  const flush = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  /**
   * Close the sheet, then act. On iOS the camera/library picker is presented by
   * UIKit, and presenting it while this modal is still on screen silently fails
   * — so the action waits for `onDismiss`. Android has no such constraint (and
   * fires no `onDismiss`), so it runs straight away.
   */
  const run = (action: () => void) => () => {
    pending.current = action;
    onClose();
    if (Platform.OS !== "ios") flush();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={flush}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          onPress={() => {}}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>Profile Picture</Text>

          <Option
            icon={<Camera size={20} color={colors.primary} />}
            label="Take a photo"
            onPress={run(onTakePhoto)}
          />
          <Option
            icon={<ImageIcon size={20} color={colors.primary} />}
            label="Choose from library"
            onPress={run(onChooseFromLibrary)}
          />
          {onRemovePhoto ? (
            <Option
              icon={<Trash2 size={20} color={colors.error} />}
              label="Remove current photo"
              destructive
              onPress={run(onRemovePhoto)}
            />
          ) : null}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, destructive && styles.iconBoxDestructive]}>
        {icon}
      </View>
      <Text style={[styles.optionText, destructive && styles.destructiveText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    ...shadows["2xl"],
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight30,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxDestructive: {
    backgroundColor: colors.missedBg,
  },
  optionText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  destructiveText: {
    color: colors.error,
  },
  cancel: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight05,
  },
  cancelText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primary,
  },
});
