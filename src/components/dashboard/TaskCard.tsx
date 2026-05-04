import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from '../../theme';

type TaskStatus = 'done' | 'active' | 'pending';

interface TaskCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: TaskStatus;
  onStart?: () => void;
}

export function TaskCard({ icon, title, subtitle, status, onStart }: TaskCardProps) {
  const isActive = status === 'active';

  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      <View style={styles.left}>
        <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.subtitle, isActive && styles.activeSubtitle]}>
            {subtitle}
          </Text>
        </View>
      </View>

      {status === 'done' && (
        <View style={styles.doneBadge}>
          <Text style={styles.doneText}>✓ Done</Text>
        </View>
      )}

      {isActive && (
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: colors.primaryLight30,
    shadowColor: '#8A6E47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBox: {
    backgroundColor: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  activeSubtitle: {
    fontStyle: 'normal',
    color: colors.primary,
    fontWeight: '500',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 4,
  },
  doneText: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    ...shadows.sm,
  },
  startButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.95 }],
  },
  startButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.white,
  },
});
