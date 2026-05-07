import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  BookOpen,
  PenLine,
  Leaf,
  User,
} from 'lucide-react-native';
import { colors, fontFamilies, fontSizes, spacing } from '../theme';
import { HomeDashboard } from '../screens/HomeDashboard';
import { JournalListScreen } from '../screens/JournalListScreen';
import { BibleReaderScreen } from '../screens/BibleReaderScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RetreatScreen } from '../screens/RetreatScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeDashboard}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Bible"
        component={BibleReaderScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PenLine size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Retreat"
        component={RetreatScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Leaf size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
    paddingTop: 8,
    height: 88,
    position: 'absolute',
    elevation: 0,
  },
  tabLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  tabItem: {
    gap: 2,
  },
});

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontFamily: fontFamilies.serif,
    fontSize: fontSizes['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
