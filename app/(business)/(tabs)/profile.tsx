import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeftRight,
  Bell,
  Building2,
  CircleHelp,
  History,
  Info,
  LogOut,
  Moon,
  Settings,
  Star,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SettingsGroup } from '@/components/profile/SettingsGroup';
import { SettingsItem } from '@/components/profile/SettingsItem';
import { SentryTestSettingsItem } from '@/components/dev/SentryTestSettingsItem';
import { Card } from '@/components/ui/Card';
import { StatisticCard } from '@/components/ui/StatisticCard';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AuthHref } from '@/features/auth/navigation';
import {
  pushCreateOrganization,
  pushEditOrganization,
  pushOwnerHistory,
  pushOwnerReviews,
} from '@/features/business/navigation';
import {
  pushAbout,
  pushHelp,
  pushNotificationSettings,
  pushSettings,
  pushThemeSettings,
} from '@/features/profile/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { dataAccess } from '@/data';
import { useCurrentProfileQuery } from '@/features/profile/hooks/use-current-profile';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useBusinessQueues } from '@/features/queue/hooks/use-queue-queries';
import { useOrganizationServedToday } from '@/features/history/hooks/use-organization-served-today';

export default function BusinessProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, profile, role, signOut, switchRole, isLoading } = useAuth();
  useCurrentProfileQuery(Boolean(user?.id));
  const { data: organization } = useMyOrganization();
  const { data: queues = [] } = useBusinessQueues(organization?.id);
  const { data: servedToday = 0 } = useOrganizationServedToday(organization?.id);

  const displayName = profile?.fullName ?? user?.fullName;
  const displayEmail = profile?.email ?? user?.email;
  const displayPhone = profile?.phone ?? user?.phone;
  const displayAvatar = profile?.avatarUrl ?? user?.avatarUrl;
  const memberSince = profile?.createdAt ?? organization?.createdAt;
  const activeQueueCount = queues.filter((q) => q.status === 'active').length;

  const onSignOut = async () => {
    if (isLoading) return;
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
          name={displayName}
          email={displayEmail}
          phone={displayPhone}
          avatarUrl={displayAvatar}
          membershipSince={memberSince}
        />

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <Card
            style={[
              styles.roleCard,
              { backgroundColor: theme.tints.primary.bg, borderColor: theme.tints.primary.border },
            ]}
          >
            <Text style={[styles.roleLabel, { color: theme.tints.primary.fg }]}>
              {t('profile.currentRole')}
            </Text>
            <Text style={[styles.roleValue, { color: theme.tints.primary.fg }]}>
              {dataAccess.getRoleDisplayLabel(role)}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.padded}>
          <View style={styles.stats}>
            <StatisticCard label={t('profile.activeQueues')} value={String(activeQueueCount)} />
            <StatisticCard label={t('profile.servedToday')} value={String(servedToday)} />
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <SettingsGroup title={t('profile.account')} index={0}>
            <SettingsItem
              icon={<Building2 size={18} color={Colors.primary} />}
              label={t('profile.myOrganization')}
              description={organization ? organization.name : t('profile.myOrganizationHint')}
              onPress={organization ? pushEditOrganization : pushCreateOrganization}
            />
            <SettingsItem
              icon={<History size={18} color={Colors.primary} />}
              label={t('profile.history')}
              description={t('profile.historyHint')}
              onPress={pushOwnerHistory}
            />
            <SettingsItem
              icon={<Star size={18} color={Colors.secondary} />}
              label={t('profile.reviews')}
              description={t('profile.reviewsHint')}
              onPress={pushOwnerReviews}
            />
            <SettingsItem
              icon={<Settings size={18} color={Colors.primary} />}
              label={t('profile.settings')}
              onPress={pushSettings}
            />
            <SettingsItem
              icon={<Bell size={18} color={Colors.primary} />}
              label={t('profile.notificationPreferences')}
              onPress={pushNotificationSettings}
            />
            <SettingsItem
              icon={<Moon size={18} color={Colors.primary} />}
              label={t('profile.theme')}
              onPress={pushThemeSettings}
            />
            <SettingsItem
              icon={<CircleHelp size={18} color={Colors.primary} />}
              label={t('profile.help')}
              onPress={pushHelp}
            />
            <SettingsItem
              icon={<Info size={18} color={Colors.primary} />}
              label={t('profile.about')}
              onPress={pushAbout}
              showDivider={false}
            />
          </SettingsGroup>
        </View>

        {/* DEV ONLY — remove before production */}
        {__DEV__ ? (
          <View style={styles.padded}>
            <SettingsGroup title={t('profile.developer')} index={1}>
              <SettingsItem
                icon={<ArrowLeftRight size={18} color={Colors.accent} />}
                label={t('profile.switchRole')}
                description={t('profile.switchRoleCustomer')}
                onPress={() => void onDevSwitchRole()}
              />
              <SentryTestSettingsItem showDivider={false} />
            </SettingsGroup>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.padded}>
          <Pressable
            onPress={() => void onSignOut()}
            disabled={isLoading}
            style={[
              styles.logout,
              { backgroundColor: theme.tints.error.bg, opacity: isLoading ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.signOutA11y')}
            accessibilityState={{ disabled: isLoading, busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <LogOut size={18} color={Colors.error} />
            )}
            <Text style={styles.logoutText}>
              {isLoading ? t('common.signingOut') : t('common.signOut')}
            </Text>
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
  },
  roleLabel: {
    ...Typography.caption,
  },
  roleValue: {
    ...Typography.h3,
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
