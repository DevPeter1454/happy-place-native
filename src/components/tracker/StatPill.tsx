import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../../theme";

interface StatPillProps {
  value: string;
  label: string;
  color: string;
}

/** One figure in a tracker's monthly stats row. */
export function StatPill({ value, label, color }: StatPillProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  value: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textPlaceholder,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
});
