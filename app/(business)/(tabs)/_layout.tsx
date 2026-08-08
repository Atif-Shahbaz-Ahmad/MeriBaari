import { Tabs } from 'expo-router';
import { BriefcaseBusiness, LayoutDashboard, ListOrdered, UserRound } from 'lucide-react-native';
import { Platform } from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';

export default function BusinessTabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarAccessibilityLabel: 'Dashboard tab',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          tabBarAccessibilityLabel: 'Queue tab',
          tabBarIcon: ({ color, size }) => (
            <ListOrdered color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarAccessibilityLabel: 'Services tab',
          tabBarIcon: ({ color, size }) => (
            <BriefcaseBusiness color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
