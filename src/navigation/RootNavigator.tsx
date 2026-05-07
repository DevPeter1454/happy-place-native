import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { PrayerTrackerScreen } from "../screens/PrayerTrackerScreen";
import { NewJournalEntryScreen } from "../screens/NewJournalEntryScreen";
import { AuthNavigator } from "./AuthNavigator";
import type { RootStackParamList } from "./types";

import { RetreatDashboardScreen } from "../screens/RetreatDashboardScreen";


const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#F8F6F2" },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="PrayerTracker" component={PrayerTrackerScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="NewJournalEntry" component={NewJournalEntryScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="RetreatDashboard" component={RetreatDashboardScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
