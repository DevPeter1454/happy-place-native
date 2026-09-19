import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { MotiView } from "moti";
import { ChevronDown, ChevronLeft, LifeBuoy, Mail } from "lucide-react-native";
import {
  colors,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
} from "../theme";
import { useAuth } from "../context/AuthContext";
import { FAQ, SUPPORT_EMAIL } from "../constants/support";

/**
 * Answers to the questions support actually receives, plus a pre-filled email to
 * a human. The email body carries the app version and platform so a reply
 * doesn't have to start by asking for them.
 */
export function SupportCenterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const contactSupport = async () => {
    const body = [
      "",
      "",
      "---",
      "Please keep the details below — they help us help you.",
      `App: Happy Place v${appVersion}`,
      `Platform: ${Platform.OS} ${Platform.Version}`,
      `Account: ${user?.email ?? "signed out"}`,
    ].join("\n");

    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      "Happy Place support"
    )}&body=${encodeURIComponent(body)}`;

    try {
      const opened = await Linking.canOpenURL(url);
      if (!opened) throw new Error("no mail client");
      await Linking.openURL(url);
    } catch {
      // No mail app configured — give them the address to use elsewhere.
      Alert.alert(
        "No email app found",
        `Write to us at ${SUPPORT_EMAIL} and include your app version (v${appVersion}).`
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Support Center</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <LifeBuoy size={24} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroSubtitle}>
            Start with the answers below — if you're still stuck, send us a note
            and we'll reply.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Frequently asked</Text>
        <View style={styles.faqList}>
          {FAQ.map((entry, index) => {
            const isOpen = openIndex === index;
            return (
              <Pressable
                key={entry.question}
                onPress={() => setOpenIndex(isOpen ? null : index)}
                style={({ pressed }) => [
                  styles.faqItem,
                  index < FAQ.length - 1 && styles.faqDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{entry.question}</Text>
                  <MotiView
                    animate={{ rotate: isOpen ? "180deg" : "0deg" }}
                    transition={{ type: "timing", duration: 180 }}
                  >
                    <ChevronDown size={18} color={colors.primary} />
                  </MotiView>
                </View>
                {isOpen ? (
                  <MotiView
                    from={{ opacity: 0, translateY: -4 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 180 }}
                  >
                    <Text style={styles.faqAnswer}>{entry.answer}</Text>
                  </MotiView>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Still need a hand?</Text>
        <Pressable
          onPress={contactSupport}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
        >
          <View style={styles.iconBox}>
            <Mail size={20} color={colors.primary} />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactLabel}>Email support</Text>
            <Text style={styles.contactSubtitle}>{SUPPORT_EMAIL}</Text>
          </View>
        </Pressable>

        <Text style={styles.versionInfo}>HAPPY PLACE V{appVersion}</Text>
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  faqList: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    overflow: "hidden",
    marginBottom: spacing["2xl"],
    ...shadows.sm,
  },
  faqItem: {
    padding: spacing.lg,
  },
  faqDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight05,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  faqAnswer: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryLight05,
    ...shadows.sm,
  },
  pressed: {
    backgroundColor: colors.primaryLight05,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  versionInfo: {
    fontFamily: fontFamilies.sans,
    fontSize: 10,
    color: "rgba(138, 110, 71, 0.4)",
    fontWeight: "700",
    marginTop: spacing["2xl"],
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
