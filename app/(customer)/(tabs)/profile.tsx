import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { dataAccess } from '@/data';
import { useCurrentProfileQuery } from '@/features/profile/hooks/use-current-profile';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeStore } from '@/store/theme-store';

const LANGUAGE_OPTIONS = dataAccess.LANGUAGE_OPTIONS;
const MOCK_PROFILE_STATS = dataAccess.MOCK_PROFILE_STATS;

export default function ProfileScreen() {
  const { user, profile, role, signOut, switchRole } = useAuth();
  useCurrentProfileQuery(Boolean(user?.id));
  const preference = useThemeStore((s) => s.preference);
  const language = usePreferencesStore((s) => s.language);
  const languageLabel =
    LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? 'English';

  const displayName = profile?.fullName ?? user?.fullName;
  const displayEmail = profile?.email ?? user?.email;
  const displayPhone = profile?.phone ?? user?.phone;
  const displayAvatar = profile?.avatarUrl ?? user?.avatarUrl;
  const memberSince = profile?.createdAt ?? MOCK_PROFILE_STATS.membershipSince;

  const onSignOut = async () => {
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
          <Card style={styles.roleCard}>
            <Text style={styles.roleLabel}>Current role</Text>
            <Text style={styles.roleValue}>{dataAccess.getRoleDisplayLabel(role)}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <View style={styles.stats}>
            <StatisticCard
              label="Queues Joined"
              value={String(MOCK_PROFILE_STATS.queuesJoined)}
            />
            <StatisticCard
              label="Hours Saved"
              value={String(MOCK_PROFILE_STATS.hoursSaved)}
            />
          </View>
          <View style={styles.stats}>
            <StatisticCard
              label="Avg. Wait"
              value={`${MOCK_PROFILE_STATS.averageWaitingMinutes} min`}
            />
            <StatisticCard
              label="Favorite"
              value={MOCK_PROFILE_STATS.favoriteOrganization.split(' ')[0] ?? '—'}
            />
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <SettingsGroup title="Quick actions" index={0}>
            <SettingsItem
              icon={<UserRound size={18} color={Colors.primary} />}
              label="Edit Profile"
              onPress={pushEditProfile}
            />
            <SettingsItem
              icon={<Bell size={18} color={Colors.primary} />}
              label="Notification Preferences"
              onPress={pushNotificationSettings}
            />
            <SettingsItem
              icon={<Shield size={18} color={Colors.primary} />}
              label="Privacy"
              onPress={pushPrivacy}
            />
            <SettingsItem
              icon={<Languages size={18} color={Colors.primary} />}
              label="Language"
              value={languageLabel}
              onPress={pushLanguageSettings}
            />
            <SettingsItem
              icon={<Moon size={18} color={Colors.primary} />}
              label="Theme"
              value={preference}
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

        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.padded}>
          <Card padded={false}>
            <SettingsItem
              icon={<Moon size={18} color={Colors.primary} />}
              label="Open Settings"
              description="General, accessibility, and account"
              onPress={pushSettings}
              showDivider={false}
            />
          </Card>
        </Animated.View>

        {/* DEV ONLY — remove before production */}
        {__DEV__ ? (
          <View style={styles.padded}>
            <SettingsGroup title="Developer" index={2}>
              <SettingsItem
                icon={<ArrowLeftRight size={18} color={Colors.accent} />}
                label="Switch Role"
                description="DEV: jump to Business app"
                onPress={() => void onDevSwitchRole()}
                showDivider={false}
              />
            </SettingsGroup>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.padded}>
          <Pressable
            onPress={() => void onSignOut()}
            style={[styles.logout, { backgroundColor: Colors.error50 }]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            accessibilityHint="Signs you out of MeriBaari"
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
