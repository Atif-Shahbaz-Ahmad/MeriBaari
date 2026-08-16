import { Tabs } from 'expo-router';
import { Bell, Home, Ticket, UserRound } from 'lucide-react-native';
import { Platform } from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import {
  useNotificationsRealtime,
  useUnreadNotificationCount,
} from '@/features/notifications/hooks/use-notifications';

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  useNotificationsRealtime();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

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
          title: t('tabs.customer.home'),
          tabBarAccessibilityLabel: t('tabs.customer.homeA11y'),
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: t('tabs.customer.tickets'),
          tabBarAccessibilityLabel: t('tabs.customer.ticketsA11y'),
          tabBarIcon: ({ color, size }) => (
            <Ticket color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.customer.notifications'),
          tabBarAccessibilityLabel:
            unreadCount > 0
              ? t('tabs.customer.notificationsA11yUnread', { count: unreadCount })
              : t('tabs.customer.notificationsA11y'),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.error,
            fontSize: 10,
            fontFamily: 'PlusJakartaSans_600SemiBold',
          },
          tabBarIcon: ({ color, size }) => (
            <Bell color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.customer.profile'),
          tabBarAccessibilityLabel: t('tabs.customer.profileA11y'),
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
