import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeftRight,
  CircleHelp,
  Info,
  LogOut,
  Moon,
  Settings,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SettingsGroup } from '@/components/profile/SettingsGroup';
import { SettingsItem } from '@/components/profile/SettingsItem';
import { Card } from '@/components/ui/Card';
import { StatisticCard } from '@/components/ui/StatisticCard';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AuthHref } from '@/features/auth/navigation';
import {
  pushAbout,
  pushHelp,
  pushSettings,
  pushThemeSettings,
} from '@/features/profile/navigation';
import { useAuth } from '@/hooks/use-auth';
import { dataAccess } from '@/data';

const MOCK_BUSINESS_PROFILE_STATS = dataAccess.MOCK_BUSINESS_PROFILE_STATS;

export default function BusinessProfileScreen() {
  const { user, role, signOut, switchRole } = useAuth();

  const onSignOut = async () => {
    await signOut();
    router.replace(AuthHref.welcome);
  };

  /**
   * DEV ONLY — Switch Role for Expo Go demos.
   * Delete this block (and the SettingsItem below) before production.
   */
  const onDevSwitchRole = async () => {
    await switchRole('customer');
    router.replace(AuthHref.customerHome);
  };

  return (
    <Screen padded={false} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={user?.fullName}
          email={user?.email}
          phone={user?.phone}
          avatarUrl={user?.avatarUrl}
          membershipSince={MOCK_BUSINESS_PROFILE_STATS.membershipSince}
        />

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <Card style={styles.roleCard}>
            <Text style={styles.roleLabel}>Current role</Text>
            <Text style={styles.roleValue}>{dataAccess.getRoleDisplayLabel(role)}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.padded}>
          <View style={styles.stats}>
            <StatisticCard
              label="Active Queues"
              value={String(MOCK_BUSINESS_PROFILE_STATS.activeQueues)}
            />
            <StatisticCard
              label="Served Today"
              value={String(MOCK_BUSINESS_PROFILE_STATS.customersServedToday)}
            />
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <SettingsGroup title="Account" index={0}>
            <SettingsItem
              icon={<Settings size={18} color={Colors.primary} />}
              label="Settings"
              onPress={pushSettings}
            />
            <SettingsItem
              icon={<Moon size={18} color={Colors.primary} />}
              label="Theme"
              onPress={pushThemeSettings}
            />
            <SettingsItem
              icon={<CircleHelp size={18} color={Colors.primary} />}
              label="Help & Support"
              onPress={pushHelp}
            />
            <SettingsItem
              icon={<Info size={18} color={Colors.primary} />}
              label="About MeriBaari"
              onPress={pushAbout}
              showDivider={false}
            />
          </SettingsGroup>
        </View>

        {/* DEV ONLY — remove before production */}
        {__DEV__ ? (
          <View style={styles.padded}>
            <SettingsGroup title="Developer" index={1}>
              <SettingsItem
                icon={<ArrowLeftRight size={18} color={Colors.accent} />}
                label="Switch Role"
                description="DEV: jump to Customer app"
                onPress={() => void onDevSwitchRole()}
                showDivider={false}
              />
            </SettingsGroup>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.padded}>
          <Pressable
            onPress={() => void onSignOut()}
            style={[styles.logout, { backgroundColor: Colors.error50 }]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  roleCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary50,
    borderColor: Colors.primary100,
  },
  roleLabel: {
    ...Typography.caption,
    color: Colors.primary700,
  },
  roleValue: {
    ...Typography.h3,
    color: Colors.primary,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  logout: {
    minHeight: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  logoutText: {
    ...Typography.button,
    color: Colors.error,
  },
});
