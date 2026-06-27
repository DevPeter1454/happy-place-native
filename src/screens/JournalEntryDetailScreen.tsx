import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ChevronLeft } from "lucide-react-native";
import { MotiView } from "moti";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import type { RootStackScreenProps } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { setFavorite } from "../services/journal.service";
import { getMood, imageForEntry } from "../constants/moods";
import { FavoriteHeart } from "../components/journal/FavoriteHeart";

export function JournalEntryDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<"JournalEntryDetail">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { entryId, title, body, mood, createdAt, isFavorite } = route.params;

  const [favorite, setFavoriteState] = useState(!!isFavorite);

  const moodInfo = getMood(mood);
  const date = new Date(createdAt);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const toggleFavorite = () => {
    if (!user?.uid) return;
    const next = !favorite;
    setFavoriteState(next); // optimistic
    setFavorite(user.uid, entryId, next).catch(() => setFavoriteState(!next));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: imageForEntry(entryId, mood) }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <Pressable
            style={[styles.backButton, { top: Math.max(insets.top, spacing.md) }]}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.white} />
          </Pressable>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.body}
        >
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.date}>{dateLabel}</Text>
              <Text style={styles.time}>{timeLabel}</Text>
            </View>
            <FavoriteHeart
              active={favorite}
              onToggle={toggleFavorite}
              size={24}
              style={styles.favoriteButton}
            />
          </View>

          {moodInfo && (
            <View style={styles.moodPill}>
              <Text style={styles.moodEmoji}>{moodInfo.emoji}</Text>
              <Text style={styles.moodText}>Feeling {moodInfo.label}</Text>
            </View>
          )}

          {!!title && <Text style={styles.title}>{title}</Text>}

          <Text style={styles.entryBody}>{body}</Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    width: "100%",
    height: 280,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: -spacing["2xl"],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  date: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  time: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primaryLight30,
    marginTop: 2,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight05,
    marginBottom: spacing.lg,
  },
  moodEmoji: {
    fontSize: fontSizes.sm,
  },
  moodText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  entryBody: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: 28,
  },
});
