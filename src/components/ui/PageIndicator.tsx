import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, radii } from '../../theme';

interface PageIndicatorProps {
  total: number;
  current: number;
}

export function PageIndicator({ total, current }: PageIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <MotiView
          key={i}
          animate={{
            width: i === current ? 24 : 8,
            backgroundColor: i === current ? colors.primary : `${colors.primary}33`,
          }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.dot}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: radii.full,
  },
});
