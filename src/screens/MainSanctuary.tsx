import { Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Sparkles } from 'lucide-react-native';
import { colors, fontFamilies, fontSizes, spacing } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function MainSanctuary({ navigation }: RootStackScreenProps<'Main'>) {
  const insets = useSafeAreaInsets();

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600 }}
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Sparkles size={64} color={colors.primary} />
      <Text style={styles.title}>Welcome Home</Text>
      <Text style={styles.subtitle}>
        The sanctuary is now open for your reflection.
      </Text>
      <Pressable
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
        style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
      >
        <Text style={styles.linkText}>Return to start</Text>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing['2xl'],
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes['4xl'],
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
    textAlign: 'center',
  },
  link: {
    paddingVertical: spacing.sm,
  },
  linkPressed: {
    opacity: 0.6,
  },
  linkText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.primary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
