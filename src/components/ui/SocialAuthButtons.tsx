import { View, Pressable, StyleSheet } from 'react-native';
import { Apple } from 'lucide-react-native';
import { GoogleLogo } from '../icons/GoogleLogo';
import { colors, radii, spacing } from '../../theme';

export function SocialAuthButtons() {
  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {}}
      >
        <GoogleLogo size={20} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {}}
      >
        <Apple size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  button: {
    padding: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  pressed: {
    backgroundColor: `${colors.primary}0D`,
  },
});
