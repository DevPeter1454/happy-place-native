import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { ChevronLeft, CheckCircle2, MoreHorizontal, Plus } from "lucide-react-native";
import { colors, fontFamilies, fontSizes, spacing, radii, shadows } from "../theme";

const CONFESSIONS = [
  {
    id: "1",
    text: "I walk in wisdom today.",
    verse: "Proverbs 2:6",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCifV6Xj7UE9SAfZSBB5X-VNoCFxf5HISq63sUDMBzydS0egbsT1TFmf5RbYM9mVIRqUpQOcP1B_Qcz9YK6YN-dnAK1e1NxHbUZpqWHGKZHJOgiBY9-jcN-sU2IVEoYVXuFPCUYFi8ZVFSKWnXG6rmUzlo-atfznesHm022pGrSI6npZi7VzzP-7hPNJtcLe7biN9ElGGKKx1BU_p5_bsdW-tFnewsnKc0EjV-7qnG0fl3jLVlOlKYNYuVD1oT1pXnTbitQ64wt4Tnh",
  },
  {
    id: "2",
    text: "I live in God’s peace.",
    verse: "Philippians 4:7",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZipjbRBdljadk5Ie4a8Zs0DgrwgF69EtA2gaVOIR8pPns-iiP44futeI9UgU6hCZ85wrxABJmyRtkDSr1jWpFUX0YQL6pPr863P2OLSKeZnjmrsfK0zGYCuXx4CJ5Yww-YVOkoh-uYp5XFbxImAF--sFZ5dRA7VjAqIZbIr7kJH64vb2VLzEUZSZeifFr6OV-HMb1bHg2_1wEAchk7ptGNeJiWAQf9TaWMwJLgdYzlw1NHLztRCkwAn5_uUoiDUYYqccskThbXQru",
  },
  {
    id: "3",
    text: "I am strengthened with all might.",
    verse: "Colossians 1:11",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVRM7iVE4pKFcsnyldf4z-pAv_wT7U_XFt4CrcXh53eL-zefF_zFJgUZvHiLEmLfm-Xc-hecN6pRBeC2vCZG5nE5UacyjNzTfCaguDIS4rtSaCab-nY306Er-laoZIxtQxpBi-jOF0oYsl6mK_gLkL5-uAWXpzGz6REt-s2gMEvYvGjwO8ZICbcsUX5TbqjgOPuITznBKyVwfFwR4d3ffJ_lgoS_WvdNlBMIu771Le0Gz-sJewYLy4keMs6MCI7r5rMJxzkKg-QilF",
  },
];

export function ConfessionListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Confessions</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Affirmations</Text>
          <Text style={styles.sectionSubtitle}>Speak these truths over your life today</Text>
        </View>

        {CONFESSIONS.map((item, index) => (
          <MotiView
            key={item.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: index * 100 }}
            style={styles.card}
          >
            <View style={styles.cardMain}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardText}>{item.text}</Text>
                <Text style={styles.cardVerse}>{item.verse}</Text>
              </View>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
            </View>
            <View style={styles.cardActions}>
              <Pressable style={styles.completeButton}>
                <CheckCircle2 size={18} color={colors.primary} />
                <Text style={styles.completeButtonText}>Mark Completed</Text>
              </Pressable>
              <Pressable style={styles.moreButton}>
                <MoreHorizontal size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </MotiView>
        ))}
      </ScrollView>

      <Pressable 
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => navigation.navigate("AddConfession" as never)}
      >
        <Plus size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: "rgba(248, 246, 242, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138, 110, 71, 0.1)",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
    opacity: 0.7,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(138, 110, 71, 0.05)",
    ...shadows.sm,
  },
  cardMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 24,
    marginBottom: 4,
  },
  cardVerse: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: "600",
    opacity: 0.6,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(138, 110, 71, 0.05)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  completeButtonText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  moreButton: {
    padding: spacing.xs,
  },
  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
});
