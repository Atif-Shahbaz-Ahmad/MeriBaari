import { Tabs } from 'expo-router';
import { BriefcaseBusiness, LayoutDashboard, ListOrdered, UserRound } from 'lucide-react-native';
import { Platform } from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function BusinessTabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

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
          title: t('tabs.business.dashboard'),
          tabBarAccessibilityLabel: t('tabs.business.dashboardA11y'),
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: t('tabs.business.queue'),
          tabBarAccessibilityLabel: t('tabs.business.queueA11y'),
          tabBarIcon: ({ color, size }) => (
            <ListOrdered color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t('tabs.business.services'),
          tabBarAccessibilityLabel: t('tabs.business.servicesA11y'),
          tabBarIcon: ({ color, size }) => (
            <BriefcaseBusiness color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.business.profile'),
          tabBarAccessibilityLabel: t('tabs.business.profileA11y'),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
