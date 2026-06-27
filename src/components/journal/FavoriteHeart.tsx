import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MotiView } from "moti";
import { Heart } from "lucide-react-native";
import { colors } from "../../theme";

interface FavoriteHeartProps {
  active: boolean;
  onToggle: () => void;
  size?: number;
  /** Style applied to the touchable wrapper (e.g. the circular button). */
  style?: StyleProp<ViewStyle>;
}

/**
 * A heart toggle that springs/pops on every tap and emits a soft burst ring
 * when an item becomes a favorite. Shared by the journal list and detail views.
 */
export function FavoriteHeart({
  active,
  onToggle,
  size = 20,
  style,
}: FavoriteHeartProps) {
  // Bumped on each press so the animations remount and replay every time.
  const [pulse, setPulse] = useState(0);

  const handlePress = () => {
    setPulse((p) => p + 1);
    onToggle();
  };

  return (
    <Pressable hitSlop={8} onPress={handlePress} style={style}>
      <View style={styles.center}>
        {active && pulse > 0 && (
          <MotiView
            key={`ring-${pulse}`}
            pointerEvents="none"
            from={{ scale: 0.4, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ type: "timing", duration: 450 }}
            style={[
              styles.ring,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          />
        )}
        <MotiView
          key={`heart-${pulse}`}
          from={{ scale: pulse === 0 ? 1 : 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 7, stiffness: 260, mass: 0.6 }}
        >
          <Heart
            size={size}
            color={active ? colors.primary : colors.primaryLight30}
            fill={active ? colors.primary : "transparent"}
          />
        </MotiView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    backgroundColor: colors.primaryLight,
  },
});
