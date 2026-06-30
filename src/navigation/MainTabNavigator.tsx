import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBar,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
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
import {
  TabBarVisibilityProvider,
  useTabBarVisibility,
} from '../context/TabBarContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Wraps the default tab bar so it can slide off-screen on scroll. */
function AnimatedTabBar(props: BottomTabBarProps) {
  const { translateY } = useTabBarVisibility();
  return (
    <Animated.View style={[styles.tabBarWrap, { transform: [{ translateY }] }]}>
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

export function MainTabNavigator() {
  return (
    <TabBarVisibilityProvider>
      <Tabs />
    </TabBarVisibilityProvider>
  );
}

function Tabs() {
  // Always reveal the tab bar when a tab gains focus, so it can't get stuck
  // hidden after navigating away from a scrolled screen.
  const { reveal } = useTabBarVisibility();
  return (
      <Tab.Navigator
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenListeners={{ focus: () => reveal() }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          animation: 'fade',
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
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
    paddingTop: 8,
    height: 88,
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
