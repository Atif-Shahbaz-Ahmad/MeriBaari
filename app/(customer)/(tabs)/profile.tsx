import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeftRight,
  Bell,
  CircleHelp,
  Info,
  Languages,
  LogOut,
  Moon,
  Shield,
  UserRound,
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
  pushEditProfile,
  pushHelp,
  pushLanguageSettings,
  pushNotificationSettings,
  pushPrivacy,
  pushSettings,
  pushThemeSettings,
} from '@/features/profile/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { dataAccess } from '@/data';
import { useCurrentProfileQuery } from '@/features/profile/hooks/use-current-profile';
import { useMyTicketStatistics } from '@/features/history/hooks/use-my-ticket-statistics';
import { EMPTY_TICKET_STATISTICS } from '@/mock/statistics';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';

const LANGUAGE_OPTIONS = dataAccess.LANGUAGE_OPTIONS;

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, profile, role, signOut, switchRole, isLoading } = useAuth();
  useCurrentProfileQuery(Boolean(user?.id));
  const { data: stats = EMPTY_TICKET_STATISTICS } =
    useMyTicketStatistics(Boolean(user?.id));
  const favoriteLabel = stats.favoriteOrganization.split(' ')[0] || '—';
  const preference = useThemeStore((s) => s.preference);
  const language = usePreferencesStore((s) => s.language);
  const languageLabel =
    LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? t('language.title');

  const displayName = profile?.fullName ?? user?.fullName;
  const displayEmail = profile?.email ?? user?.email;
  const displayPhone = profile?.phone ?? user?.phone;
  const displayAvatar = profile?.avatarUrl ?? user?.avatarUrl;
  const memberSince = profile?.createdAt;

  const onSignOut = async () => {
    if (isLoading) return;
    await signOut();
    router.replace(AuthHref.welcome);
  };

  /**
   * DEV ONLY — Switch Role for Expo Go demos.
   * Delete this block (and the Developer SettingsItem) before production.
   */
  const onDevSwitchRole = async () => {
    await switchRole('business');
    router.replace(AuthHref.businessHome);
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
          <Card style={[styles.roleCard, { backgroundColor: theme.tints.primary.bg, borderColor: theme.tints.primary.border }]}>
            <Text style={[styles.roleLabel, { color: theme.tints.primary.fg }]}>{t('profile.currentRole')}</Text>
            <Text style={[styles.roleValue, { color: theme.tints.primary.fg }]}>{dataAccess.getRoleDisplayLabel(role)}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <View style={styles.stats}>
            <StatisticCard
              label={t('profile.statQueuesJoined')}
              value={String(stats.queuesJoined)}
            />
            <StatisticCard
              label={t('profile.statHoursSaved')}
              value={String(stats.hoursSaved)}
            />
          </View>
          <View style={styles.stats}>
            <StatisticCard
              label={t('profile.statAvgWait')}
              value={t('common.minutesShort', { count: stats.averageWaitingMinutes })}
            />
            <StatisticCard
              label={t('profile.statFavorite')}
              value={favoriteLabel}
            />
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <SettingsGroup title={t('profile.quickActions')} index={0}>
            <SettingsItem
              icon={<UserRound size={18} color={Colors.primary} />}
              label={t('profile.editProfile')}
              onPress={pushEditProfile}
            />
            <SettingsItem
              icon={<Bell size={18} color={Colors.primary} />}
              label={t('profile.notificationPreferences')}
              onPress={pushNotificationSettings}
            />
            <SettingsItem
              icon={<Shield size={18} color={Colors.primary} />}
              label={t('profile.privacy')}
              onPress={pushPrivacy}
            />
            <SettingsItem
              icon={<Languages size={18} color={Colors.primary} />}
              label={t('profile.language')}
              value={languageLabel}
              onPress={pushLanguageSettings}
            />
            <SettingsItem
              icon={<Moon size={18} color={Colors.primary} />}
              label={t('profile.theme')}
              value={preference}
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

        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.padded}>
          <Card padded={false}>
            <SettingsItem
              icon={<Moon size={18} color={Colors.primary} />}
              label={t('profile.openSettings')}
              description={t('profile.openSettingsHint')}
              onPress={pushSettings}
              showDivider={false}
            />
          </Card>
        </Animated.View>

        {/* DEV ONLY — remove before production */}
        {__DEV__ ? (
          <View style={styles.padded}>
            <SettingsGroup title={t('profile.developer')} index={2}>
              <SettingsItem
                icon={<ArrowLeftRight size={18} color={Colors.accent} />}
                label={t('profile.switchRole')}
                description={t('profile.switchRoleBusiness')}
                onPress={() => void onDevSwitchRole()}
                showDivider={false}
              />
            </SettingsGroup>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.padded}>
          <Pressable
            onPress={() => void onSignOut()}
            disabled={isLoading}
            style={[
              styles.logout,
              { backgroundColor: theme.tints.error.bg, opacity: isLoading ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.signOutA11y')}
            accessibilityHint="Signs you out of MeriBaari"
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
