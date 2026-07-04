import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  PrayerTracker: undefined;
  NewJournalEntry: undefined;
  JournalEntryDetail: {
    entryId: string;
    title?: string;
    body: string;
    mood?: string;
    /** Entry creation time as epoch milliseconds (params must be serializable). */
    createdAt: number;
    isFavorite?: boolean;
  };
  RetreatDashboard: undefined;
  ConfessionList: undefined;
  AddConfession: undefined;
  PrayerList: undefined;
};

export type AuthStackParamList = {
  Signup: undefined;
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  /** Optional passage to open, e.g. "Psalm 23"; omitted keeps last position. */
  Bible: { ref?: string } | undefined;
  Journal: undefined;
  Retreat: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;
