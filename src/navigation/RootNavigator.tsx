import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { PrayerTrackerScreen } from "../screens/PrayerTrackerScreen";
import { NewJournalEntryScreen } from "../screens/NewJournalEntryScreen";
import { JournalEntryDetailScreen } from "../screens/JournalEntryDetailScreen";
import { AuthNavigator } from "./AuthNavigator";
import type { RootStackParamList } from "./types";

import { RetreatDashboardScreen } from "../screens/RetreatDashboardScreen";
import { ConfessionListScreen } from "../screens/ConfessionListScreen";
import { AddConfessionScreen } from "../screens/AddConfessionScreen";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";


const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, initializing } = useAuth();

  // Brief loading state while the persisted session is restored on launch.
  if (initializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#F8F6F2" },
      }}
    >
      {user ? (
        // Signed in → the app: tabs plus the detail/modal screens.
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="PrayerTracker" component={PrayerTrackerScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="NewJournalEntry" component={NewJournalEntryScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="JournalEntryDetail" component={JournalEntryDetailScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="RetreatDashboard" component={RetreatDashboardScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ConfessionList" component={ConfessionListScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="AddConfession" component={AddConfessionScreen} options={{ presentation: 'modal' }} />
        </>
      ) : (
        // Signed out → intro + auth flow.
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
