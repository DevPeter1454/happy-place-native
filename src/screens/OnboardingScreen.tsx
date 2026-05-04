import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronLeft, Leaf, Flower2, Trees, Brain, Zap } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { PageIndicator } from '../components/ui/PageIndicator';
import { onboardingPages } from '../constants/onboarding';
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

function GrowthIllustration() {
  return (
    <View style={illustrationStyles.container}>
      {/* Background icons */}
      <View style={illustrationStyles.bgIcons}>
        <Leaf size={48} color={colors.textPrimary} />
        <Flower2 size={48} color={colors.textPrimary} />
        <Trees size={48} color={colors.textPrimary} />
        <Brain size={48} color={colors.textPrimary} />
      </View>

      {/* Center icon */}
      <View style={illustrationStyles.centerIcon}>
        <Zap size={40} color={colors.white} fill={colors.white} />
      </View>

      {/* Bar chart */}
      <View style={illustrationStyles.bars}>
        <View style={[illustrationStyles.bar, { height: 24, backgroundColor: `${colors.primary}66` }]} />
        <View style={[illustrationStyles.bar, { height: 40, backgroundColor: `${colors.primary}99` }]} />
        <View style={[illustrationStyles.bar, { height: 56, backgroundColor: colors.primary }]} />
        <View style={[illustrationStyles.bar, { height: 72, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgIcons: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    padding: 48,
    opacity: 0.1,
  },
  centerIcon: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  bars: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  bar: {
    width: 10,
    borderRadius: radii.full,
  },
});

export function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const [currentPage, setCurrentPage] = useState(0);
  const insets = useSafeAreaInsets();

  const isLastPage = currentPage === onboardingPages.length - 1;
  const page = onboardingPages[currentPage];

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.navigate('Auth', { screen: 'Signup' });
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 400 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {currentPage > 0 && (
            <IconButton onPress={handleBack}>
              <ChevronLeft size={24} color={colors.primary} />
            </IconButton>
          )}
        </View>
        <Text style={styles.headerTitle}>Happy Place</Text>
        <View style={styles.headerSide}>
          {!isLastPage && (
            <Text
              style={styles.skipText}
              onPress={() => setCurrentPage(onboardingPages.length - 1)}
            >
              Skip
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={currentPage}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -20 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.pageContent}
          >
            {/* Image or Illustration */}
            <View style={styles.mediaContainer}>
              {page.image ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: page.image }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={300}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)']}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              ) : (
                <View style={styles.illustrationWrapper}>
                  <GrowthIllustration />
                </View>
              )}
            </View>

            {/* Text */}
            <View style={styles.textContainer}>
              <Text style={styles.pageTitle}>
                {currentPage === 0 ? 'Welcome to\nHappy Place' : page.title}
              </Text>
              <Text style={styles.pageDescription}>{page.description}</Text>
            </View>
          </MotiView>
        </AnimatePresence>

        {/* Bottom Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + spacing['2xl'] }]}>
          <PageIndicator total={onboardingPages.length} current={currentPage} />

          <View style={styles.buttons}>
            <Button
              title={isLastPage ? 'Get Started' : 'Continue'}
              onPress={handleNext}
              icon={
                !isLastPage ? (
                  <ArrowRight size={20} color={colors.white} />
                ) : undefined
              }
            />
            {isLastPage && (
              <Button
                title="Login"
                variant="outline"
                onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerSide: {
    width: 44,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  skipText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing['2xl'],
  },
  pageContent: {
    alignItems: 'center',
    width: '100%',
  },
  mediaContainer: {
    paddingHorizontal: spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    marginBottom: spacing['3xl'],
  },
  imageWrapper: {
    aspectRatio: 4 / 5,
    borderRadius: 32,
    overflow: 'hidden',
    ...shadows['2xl'],
  },
  illustrationWrapper: {
    alignItems: 'center',
  },
  textContainer: {
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
  },
  pageTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes['4xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fontSizes['4xl'] * 1.15,
  },
  pageDescription: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: '300',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.lg * 1.6,
    maxWidth: 300,
  },
  controls: {
    alignItems: 'center',
    gap: spacing['2xl'],
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  buttons: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
});
