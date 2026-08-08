import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { formatTicketDate } from '@/utils/formatting';

interface ProfileHeaderProps {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  membershipSince?: string;
}

export function ProfileHeader({
  name,
  email,
  phone,
  avatarUrl,
  membershipSince,
}: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.duration(420)}
      style={[styles.hero, { paddingTop: insets.top + Spacing.xl }]}
      accessibilityRole="header"
    >
      <Animated.View entering={ZoomIn.delay(80).duration(400)}>
        <Avatar name={name} uri={avatarUrl} size={88} style={styles.avatar} />
      </Animated.View>
      <Text style={styles.name} accessibilityRole="text">
        {name ?? 'Guest User'}
      </Text>
      {email ? <Text style={styles.meta}>{email}</Text> : null}
      {phone ? <Text style={styles.meta}>{phone}</Text> : null}
      {membershipSince ? (
        <View style={styles.badge} accessibilityLabel={`Member since ${formatTicketDate(membershipSince)}`}>
          <Text style={styles.badgeText}>Member since {formatTicketDate(membershipSince)}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.primary,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomLeftRadius: Radius['2xl'],
    borderBottomRightRadius: Radius['2xl'],
  },
  avatar: {
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 3,
  },
  name: {
    ...Typography.h2,
    color: Colors.textInverse,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  meta: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  badge: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textInverse,
  },
});
