import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ChevronRight,
  CircleHelp,
  Info,
  Languages,
  LogOut,
  Moon,
  Bell,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { mockProfileStats } from '@/features/home/mock-data';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/store/theme-store';

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const cycleTheme = async () => {
    const order = ['system', 'light', 'dark'] as const;
    const next = order[(order.indexOf(preference) + 1) % order.length];
    await setPreference(next);
  };

  return (
    <Screen padded={false} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.hero, { paddingTop: insets.top + Spacing.xl }]}
        >
          <Avatar name={user?.fullName} uri={user?.avatarUrl} size={84} />
          <Text style={styles.name}>{user?.fullName ?? 'Guest User'}</Text>
          <Text style={styles.meta}>{user?.email ?? 'guest@meribaari.app'}</Text>
          {user?.phone ? <Text style={styles.meta}>{user.phone}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.stats}>
            <Stat label="Queues Joined" value={String(mockProfileStats.queuesJoined)} />
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <Stat label="Time Saved" value={`${mockProfileStats.timeSavedHours} hr`} />
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <Stat label="Favorites" value={String(mockProfileStats.favoritePlaces)} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.padded}>
          <Card padded={false}>
            <MenuRow
              icon={<Languages size={18} color={Colors.primary} />}
              label="Language"
              value="English"
            />
            <MenuRow
              icon={<Bell size={18} color={Colors.primary} />}
              label="Notification Settings"
            />
            <MenuRow
              icon={<Moon size={18} color={Colors.primary} />}
              label="Appearance"
              value={preference}
              onPress={() => void cycleTheme()}
            />
            <MenuRow
              icon={<CircleHelp size={18} color={Colors.primary} />}
              label="Help & Support"
            />
            <MenuRow
              icon={<Info size={18} color={Colors.primary} />}
              label="About MeriBaari"
              showDivider={false}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.padded}>
          <Pressable
            onPress={() => void onSignOut()}
            style={[styles.logout, { backgroundColor: Colors.error50 }]}
          >
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  value,
  onPress,
  showDivider = true,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showDivider?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.menuRow,
        showDivider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value ? <Text style={[styles.menuValue, { color: theme.textMuted }]}>{value}</Text> : null}
        <ChevronRight size={18} color={theme.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  hero: {
    backgroundColor: Colors.primary,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomLeftRadius: Radius['2xl'],
    borderBottomRightRadius: Radius['2xl'],
  },
  name: {
    ...Typography.h2,
    color: Colors.textInverse,
    marginTop: Spacing.sm,
  },
  meta: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.h3,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  menuRow: {
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...Typography.bodyMedium,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  menuValue: {
    ...Typography.small,
    textTransform: 'capitalize',
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
