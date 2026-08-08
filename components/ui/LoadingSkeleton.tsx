import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';

type SkeletonVariant =
  | 'organization'
  | 'list'
  | 'detail'
  | 'ticket'
  | 'profile'
  | 'notification';

interface LoadingSkeletonProps {
  count?: number;
  variant?: SkeletonVariant;
  style?: ViewStyle;
}

export function LoadingSkeleton({
  count = 3,
  variant = 'organization',
  style,
}: LoadingSkeletonProps) {
  return (
    <View
      style={[styles.stack, style]}
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </View>
  );
}

function SkeletonCard({ variant }: { variant: SkeletonVariant }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.4);
  const translate = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    translate.value = withRepeat(
      withTiming(20, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity, translate]);

  const pulse = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shimmer = useAnimatedStyle(() => ({
    transform: [{ translateX: translate.value }],
    opacity: 0.35,
  }));

  const boneColor = theme.border;

  if (variant === 'profile') {
    return (
      <Animated.View style={[styles.profileCard, { backgroundColor: theme.card }, pulse]}>
        <View style={[styles.profileBanner, { backgroundColor: boneColor }]} />
        <View style={styles.profileBody}>
          <View style={[styles.avatarLg, { backgroundColor: boneColor }]} />
          <View style={[styles.lineLg, { backgroundColor: boneColor, width: '50%', alignSelf: 'center' }]} />
          <View style={[styles.lineMd, { backgroundColor: boneColor, width: '40%', alignSelf: 'center' }]} />
          <View style={styles.statsRow}>
            <View style={[styles.statBone, { backgroundColor: boneColor }]} />
            <View style={[styles.statBone, { backgroundColor: boneColor }]} />
            <View style={[styles.statBone, { backgroundColor: boneColor }]} />
          </View>
        </View>
      </Animated.View>
    );
  }

  if (variant === 'notification') {
    return (
      <Animated.View
        style={[styles.notifCard, { backgroundColor: theme.card, borderColor: theme.border }, pulse]}
      >
        <View style={[styles.avatar, { backgroundColor: boneColor, borderRadius: Radius.md }]} />
        <View style={styles.content}>
          <View style={[styles.lineLg, { backgroundColor: boneColor }]} />
          <View style={[styles.lineMd, { backgroundColor: boneColor }]} />
          <View style={[styles.lineSm, { backgroundColor: boneColor }]} />
        </View>
        <Animated.View
          style={[styles.shimmer, { backgroundColor: theme.card }, shimmer]}
          pointerEvents="none"
        />
      </Animated.View>
    );
  }

  if (variant === 'detail') {
    return (
      <Animated.View style={[styles.detailCard, { backgroundColor: theme.card }, pulse]}>
        <View style={[styles.banner, { backgroundColor: boneColor }]} />
        <View style={styles.detailBody}>
          <View style={[styles.lineLg, { backgroundColor: boneColor }]} />
          <View style={[styles.lineMd, { backgroundColor: boneColor }]} />
          <View style={[styles.lineSm, { backgroundColor: boneColor }]} />
        </View>
      </Animated.View>
    );
  }

  if (variant === 'ticket') {
    return (
      <Animated.View
        style={[styles.ticketCard, { backgroundColor: theme.card, borderColor: theme.border }, pulse]}
      >
        <View style={styles.ticketHeader}>
          <View style={[styles.avatar, { backgroundColor: boneColor }]} />
          <View style={styles.content}>
            <View style={[styles.lineLg, { backgroundColor: boneColor }]} />
            <View style={[styles.lineMd, { backgroundColor: boneColor }]} />
          </View>
          <View style={[styles.chip, { backgroundColor: boneColor }]} />
        </View>
        <View style={[styles.lineLg, { backgroundColor: boneColor, width: '40%' }]} />
        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: boneColor, width: 80 }]} />
          <View style={[styles.chip, { backgroundColor: boneColor, width: 80 }]} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, pulse]}
    >
      <View style={[styles.avatar, { backgroundColor: boneColor }]} />
      <View style={styles.content}>
        <View style={[styles.lineLg, { backgroundColor: boneColor }]} />
        <View style={[styles.lineMd, { backgroundColor: boneColor }]} />
        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: boneColor }]} />
          <View style={[styles.chip, { backgroundColor: boneColor }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
  },
  avatarLg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    marginTop: -36,
  },
  content: {
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  lineLg: {
    height: 14,
    width: '70%',
    borderRadius: 7,
  },
  lineMd: {
    height: 12,
    width: '50%',
    borderRadius: 6,
  },
  lineSm: {
    height: 12,
    width: '40%',
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  chip: {
    height: 20,
    width: 64,
    borderRadius: Radius.full,
  },
  detailCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  banner: {
    height: 160,
  },
  detailBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  ticketCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  profileCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  profileBanner: {
    height: 120,
  },
  profileBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statBone: {
    flex: 1,
    height: 56,
    borderRadius: Radius.lg,
  },
  notifCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
  },
});
