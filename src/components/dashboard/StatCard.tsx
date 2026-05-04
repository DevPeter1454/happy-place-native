import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, fontFamilies, fontSizes, spacing, radii } from '../../theme';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  onPress?: () => void;
}

export function StatCard({ icon, value, label, onPress }: StatCardProps) {
  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.primaryLight05,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  cardPressed: {
    opacity: 0.8,
    backgroundColor: colors.primaryLight30,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  value: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
