import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  type KeyboardTypeOptions,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors, fontFamilies, fontSizes, radii, spacing } from '../../theme';

interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: RNTextInputProps['autoCapitalize'];
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  labelRight?: React.ReactNode;
  variant?: 'default' | 'icon';
}

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  leftIcon,
  rightAction,
  labelRight,
  variant = 'default',
}: TextInputProps) {
  const isIconVariant = variant === 'icon';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelRight}
      </View>
      <View style={[styles.inputWrapper, isIconVariant && styles.inputWrapperIcon]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            isIconVariant ? styles.inputIcon : styles.inputDefault,
          ]}
        />
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
  },
  inputWrapperIcon: {
    backgroundColor: `${colors.primary}0D`,
    borderColor: `${colors.primary}33`,
  },
  leftIcon: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    height: '100%',
  },
  inputDefault: {
    paddingHorizontal: 15,
  },
  inputIcon: {
    paddingLeft: 48,
    paddingRight: 15,
  },
  rightAction: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
});
