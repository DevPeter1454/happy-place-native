import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Leaf, Sparkles, Flower2, UserRound } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

const MAX_BAR_WIDTH = 260;

export function SplashScreen({ navigation }: RootStackScreenProps<'Splash'>) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const barWidth = Math.min(screenWidth - 2 * spacing.xl, MAX_BAR_WIDTH);
  const targetWidth = barWidth * 0.45;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600 }}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={[colors.background, colors.primaryGold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
          style={styles.content}
        >
          {/* Icon Circle */}
          <View style={styles.iconCircle}>
            <Leaf
              size={48}
              color={colors.primary}
              fill="rgba(138, 110, 71, 0.2)"
              strokeWidth={1.5}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Happy Place</Text>
          <Text style={styles.tagline}>Your quiet place with God</Text>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { width: barWidth }]}>
            <View style={styles.progressBarTrack}>
              <MotiView
                from={{ width: 0 }}
                animate={{ width: targetWidth }}
                transition={{ type: 'timing', duration: 1200 }}
                style={styles.progressBarFill}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              title="Enter Sanctuary"
              onPress={() => navigation.replace('Onboarding')}
            />
            <Button
              title="Our Mission"
              variant="outline"
              onPress={() => {}}
            />
          </View>
        </MotiView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Breathe & Reflect</Text>
          <View style={styles.footerIcons}>
            <Sparkles size={16} color={`${colors.textSecondary}99`} />
            <Flower2 size={16} color={`${colors.textSecondary}99`} />
            <UserRound size={16} color={`${colors.textSecondary}99`} />
          </View>
        </View>
      </LinearGradient>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
    ...shadows['2xl'],
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes['5xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fontFamilies.serifItalic,
    fontSize: fontSizes.lg,
    fontWeight: '300',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing['3xl'],
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: spacing['2xl'],
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  buttons: {
    width: '100%',
    maxWidth: MAX_BAR_WIDTH,
    gap: spacing.lg,
  },
  footer: {
    position: 'absolute',
    bottom: spacing['3xl'],
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: `${colors.textSecondary}99`,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  footerIcons: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
});
