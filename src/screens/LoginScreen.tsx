import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { ArrowLeft, Eye, EyeOff, Flower2 } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { IconButton } from '../components/ui/IconButton';
import { Divider } from '../components/ui/Divider';
import { GoogleLogo } from '../components/icons/GoogleLogo';
import { colors, fontFamilies, fontSizes, spacing, radii } from '../theme';
import type { AuthStackScreenProps } from '../navigation/types';

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()} size={48}>
          <ArrowLeft size={24} color={colors.primary} />
        </IconButton>
        <Text style={styles.headerTitle}>Happy Place</Text>
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Find your peace and calm</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              labelRight={
                <Pressable onPress={() => {}}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              }
              rightAction={
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textPlaceholder} />
                  ) : (
                    <Eye size={20} color={colors.textPlaceholder} />
                  )}
                </Pressable>
              }
            />

            <View style={styles.loginButtonWrapper}>
              <Button title="Login" onPress={handleLogin} />
            </View>
          </View>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <Divider text="Or continue with" />
            <Button
              title="Continue with Google"
              variant="social"
              icon={<GoogleLogo size={20} />}
              onPress={() => {}}
            />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupLink}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupAction}>Create Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.footerIcon}>
          <Flower2 size={28} color={colors.primary} />
        </View>
        <Text style={styles.footerText}>Your Mindful Companion</Text>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeSection: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  welcomeTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes['4xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  forgotText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  loginButtonWrapper: {
    paddingTop: spacing.lg,
  },
  socialSection: {
    marginTop: spacing['2xl'],
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  signupText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  signupAction: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  footerIcon: {
    padding: spacing.md,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}1A`,
    marginBottom: spacing.lg,
  },
  footerText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPlaceholder,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
