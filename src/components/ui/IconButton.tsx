import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii } from '../../theme';

interface IconButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'light';
  size?: number;
  style?: ViewStyle;
}

export function IconButton({
  onPress,
  children,
  variant = 'default',
  size = 44,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        variant === 'default' && styles.default,
        variant === 'light' && styles.light,
        pressed && styles.pressed,
        style,
      ]}
      hitSlop={8}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  default: {
    backgroundColor: `${colors.primary}1A`,
  },
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  pressed: {
    opacity: 0.7,
  },
});
