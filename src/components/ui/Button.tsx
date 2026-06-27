import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { colors, fontFamilies, fontSizes, radii, shadows, spacing } from '../../theme';

type ButtonVariant = 'primary' | 'outline' | 'social';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isInactive = disabled || loading;
  const spinnerColor =
    variant === 'primary' ? colors.white : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isInactive && pressedStyles[variant],
        isInactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          <Text style={[styles.baseText, variantTextStyles[variant]]}>{title}</Text>
          {icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
  },
  baseText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  inactive: {
    opacity: 0.6,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
    ...shadows.lg,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 2,
    borderColor: `${colors.primary}4D`,
  },
  social: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
};

const pressedStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primaryDark },
  outline: { backgroundColor: `${colors.primary}0D` },
  social: { backgroundColor: `${colors.white}CC` },
};

const variantTextStyles: Record<ButtonVariant, object> = {
  primary: { color: colors.white },
  outline: { color: colors.primary },
  social: { color: colors.textSecondary, fontWeight: '500' as const },
};
