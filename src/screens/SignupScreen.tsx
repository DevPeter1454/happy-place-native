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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, User, Mail, Lock } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { IconButton } from '../components/ui/IconButton';
import { Divider } from '../components/ui/Divider';
import { SocialAuthButtons } from '../components/ui/SocialAuthButtons';
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from '../theme';
import type { AuthStackScreenProps } from '../navigation/types';

const HEADER_IMAGE =
  'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2067&auto=format&fit=crop';

export function SignupScreen({ navigation }: AuthStackScreenProps<'Signup'>) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const insets = useSafeAreaInsets();

  const handleSignup = () => {
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
      style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card */}
          <View style={styles.card}>
            {/* Header Image */}
            <View style={styles.imageHeader}>
              <Image
                source={{ uri: HEADER_IMAGE }}
                style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={[`${colors.primary}33`, `${colors.primary}66`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.backButtonContainer}>
                <IconButton
                  variant="light"
                  onPress={() => navigation.goBack()}
                >
                  <ArrowLeft size={20} color={colors.textPrimary} />
                </IconButton>
              </View>
            </View>

            {/* Form Content */}
            <View style={styles.formContent}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Join Happy Place</Text>
                <Text style={styles.subtitle}>
                  Step into a world of peace and positivity. Your journey to
                  mindfulness begins here.
                </Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  variant="icon"
                  leftIcon={
                    <User size={20} color={`${colors.primary}99`} />
                  }
                />

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  variant="icon"
                  leftIcon={
                    <Mail size={20} color={`${colors.primary}99`} />
                  }
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a strong password"
                  secureTextEntry
                  variant="icon"
                  leftIcon={
                    <Lock size={20} color={`${colors.primary}99`} />
                  }
                />

                <View style={styles.submitButton}>
                  <Button
                    title="Create Account"
                    onPress={handleSignup}
                    icon={<ArrowRight size={20} color={colors.white} />}
                  />
                </View>
              </View>

              {/* Bottom Navigation */}
              <View style={styles.bottomSection}>
                <View style={styles.loginLink}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <Pressable onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginAction}>Log in</Text>
                  </Pressable>
                </View>

                <Divider text="Or continue with" />
                <SocialAuthButtons />
              </View>
            </View>
          </View>

          {/* Footer Quote */}
          <Text style={styles.footerQuote}>
            "Happiness is a journey, not a destination."
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.primary}1A`,
    ...shadows['2xl'],
  },
  imageHeader: {
    height: 192,
    width: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
  },
  formContent: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  titleSection: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes['4xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: fontSizes.base * 1.6,
  },
  form: {
    gap: spacing.xl,
  },
  submitButton: {
    paddingTop: spacing.sm,
  },
  bottomSection: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  loginAction: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  footerQuote: {
    fontFamily: fontFamilies.serifItalic,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing['2xl'],
    textAlign: 'center',
  },
});
