import { Tabs } from 'expo-router';
import { Bell, Home, Ticket, UserRound } from 'lucide-react-native';
import { Platform } from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import { useNotificationStore } from '@/store/notification-store';

export default function TabsLayout() {
  const theme = useTheme();
  const unreadCount = useNotificationStore((s) => s.unreadCount());

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
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'My Tickets',
          tabBarAccessibilityLabel: 'My Tickets tab',
          tabBarIcon: ({ color, size }) => <Ticket color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarAccessibilityLabel:
            unreadCount > 0
              ? `Notifications tab, ${unreadCount} unread`
              : 'Notifications tab',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.error,
            fontSize: 10,
            fontFamily: 'PlusJakartaSans_600SemiBold',
          },
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} strokeWidth={2} />,
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
