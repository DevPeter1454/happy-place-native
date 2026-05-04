import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../../theme";

export interface JournalCardProps {
  id: string;
  date: string;
  previewText: string;
  time: string;
  imageUrl?: string;
  isFavorite?: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
}

export function JournalCard({
  date,
  previewText,
  time,
  imageUrl,
  isFavorite,
  onPress,
  onToggleFavorite,
}: JournalCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.date}>{date}</Text>
          <Pressable
            hitSlop={8}
            onPress={onToggleFavorite}
            style={styles.favoriteButton}
          >
            <Heart
              size={20}
              color={isFavorite ? colors.primary : colors.primaryLight30}
              fill={isFavorite ? colors.primary : "transparent"}
            />
          </Pressable>
        </View>

        <Text style={styles.previewText} numberOfLines={2}>
          {previewText}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.time}>{time}</Text>
          <Pressable style={styles.readMoreButton}>
            <Text style={styles.readMoreText}>Read More</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    overflow: "hidden",
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: "100%",
    height: 160,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  date: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  favoriteButton: {
    padding: 2,
  },
  previewText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: "500",
    color: colors.primaryLight30,
  },
  readMoreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  readMoreText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.white,
  },
});
