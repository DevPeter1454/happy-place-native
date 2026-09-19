import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from '../../theme';

interface ProgressCardProps {
  percentage: number;
  completed: number;
  total: number;
  streakDays: number;
}

/**
 * A line that matches where the day actually is. This was previously a fixed
 * "You're almost there" — which read wrong at 0% and, worse, still nagged after
 * everything was done.
 */
function encouragementFor(completed: number, total: number): string {
  if (total <= 0) return "Nothing to do today.";
  if (completed === 0) return "A fresh day — begin whenever you're ready.";
  if (completed >= total) return "All done for today. Well done.";
  if (completed >= total / 2) return "You're almost there, keep going.";
  return "A good start — keep going.";
}

export function ProgressCard({ percentage, completed, total, streakDays }: ProgressCardProps) {
  const isComplete = total > 0 && completed >= total;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Today's Progress</Text>
          <Text style={[styles.subtitle, isComplete && styles.subtitleComplete]}>
            {encouragementFor(completed, total)}
          </Text>
        </View>
        <Text style={[styles.percentage, isComplete && styles.percentageComplete]}>
          {percentage}%
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${percentage}%` as any }}
          transition={{ type: 'timing', duration: 800, delay: 300 }}
          style={[styles.progressFill, isComplete && styles.progressFillComplete]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Consistency Streak: {streakDays} Days
        </Text>
        <Text style={styles.footerText}>
          {completed} / {total} completed
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  percentage: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  progressFillComplete: {
    backgroundColor: colors.success,
  },
  subtitleComplete: {
    color: colors.success,
    fontWeight: '600',
  },
  percentageComplete: {
    color: colors.success,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
