import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors, fontFamilies, radii } from "../../theme";

interface AvatarProps {
  /** Remote or local image URI; falls back to initials when absent. */
  uri?: string | null;
  /** Used to derive the initials shown when there is no image. */
  name?: string | null;
  size?: number;
}

/** Up to two initials from a display name, e.g. "Peter Ojo" -> "PO". */
function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const letters = [parts[0], parts.length > 1 ? parts[parts.length - 1] : ""]
    .filter(Boolean)
    .map((p) => p[0]);
  return letters.join("").toUpperCase();
}

/**
 * A circular profile image. With no `uri` it renders the user's initials rather
 * than a stock photo, so a user who has never uploaded one still sees
 * themselves — and it needs no network.
 */
export function Avatar({ uri, name, size = 120 }: AvatarProps) {
  const circle = { width: size, height: size, borderRadius: radii.full };

  if (!uri) {
    return (
      <View style={[styles.placeholder, circle]}>
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>
          {initialsOf(name)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={circle}
      contentFit="cover"
      transition={200}
      accessibilityLabel="Profile picture"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  initials: {
    fontFamily: fontFamilies.serif,
    fontWeight: "700",
    color: colors.primary,
  },
});
