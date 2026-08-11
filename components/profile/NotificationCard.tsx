import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BellRing,
  CheckCircle2,
  Clock3,
  PauseCircle,
  PlayCircle,
  Ticket,
  Timer,
  XCircle,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/utils/formatting';
import type { AppNotification, NotificationType } from '@/types';

const TYPE_META: Record<
  NotificationType,
  { Icon: typeof BellRing; color: string; bg: string; categoryLabel: string }
> = {
  QUEUE_JOINED: {
    Icon: Ticket,
    color: Colors.primary,
    bg: Colors.primary50,
    categoryLabel: 'Queue',
  },
  TICKET_CALLED: {
    Icon: BellRing,
    color: Colors.primary,
    bg: Colors.primary50,
    categoryLabel: 'Queue',
  },
  TICKET_SERVING: {
    Icon: Timer,
    color: Colors.accent,
    bg: Colors.accent50,
    categoryLabel: 'Queue',
  },
  TICKET_SERVED: {
    Icon: CheckCircle2,
    color: Colors.secondary,
    bg: Colors.secondary50,
    categoryLabel: 'Queue',
  },
  TICKET_SKIPPED: {
    Icon: XCircle,
    color: Colors.error,
    bg: Colors.error50,
    categoryLabel: 'Queue',
  },
  QUEUE_PAUSED: {
    Icon: PauseCircle,
    color: Colors.accent,
    bg: Colors.accent50,
    categoryLabel: 'Queue',
  },
  QUEUE_RESUMED: {
    Icon: PlayCircle,
    color: Colors.secondary,
    bg: Colors.secondary50,
    categoryLabel: 'Queue',
  },
  QUEUE_CLOSED: {
    Icon: XCircle,
    color: Colors.error,
    bg: Colors.error50,
    categoryLabel: 'Queue',
  },
  QUEUE_TURN_APPROACHING: {
    Icon: Timer,
    color: Colors.accent,
    bg: Colors.accent50,
    categoryLabel: 'Reminder',
  },
  QUEUE_CANCELLED: {
    Icon: XCircle,
    color: Colors.error,
    bg: Colors.error50,
    categoryLabel: 'System',
  },
  SYSTEM: {
    Icon: BellRing,
    color: Colors.primary,
    bg: Colors.primary50,
    categoryLabel: 'System',
  },
};

interface NotificationCardProps {
  notification: AppNotification;
  index?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NotificationCard({
  notification,
  index = 0,
  onPress,
  onLongPress,
}: NotificationCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const meta = TYPE_META[notification.type] ?? TYPE_META.SYSTEM;
  const Icon = meta.Icon;
  const isRead = notification.isRead ?? notification.read;
  const body = notification.message ?? notification.description;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(380)}>
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`${isRead ? '' : 'Unread. '}${notification.title}. ${body}`}
        accessibilityHint="Double tap to open. Long press for more options."
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.card,
          Shadows.card,
          animatedStyle,
          {
            backgroundColor: theme.card,
            borderColor: isRead ? theme.border : Colors.primary100,
          },
        ]}
      >
        {!isRead ? <View style={styles.unreadDot} accessibilityElementsHidden /> : null}
        <View style={[styles.icon, { backgroundColor: meta.bg }]}>
          <Icon size={18} color={meta.color} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.text,
                  fontFamily: isRead
                    ? Typography.body.fontFamily
                    : Typography.bodyMedium.fontFamily,
                },
              ]}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            <Text style={[styles.time, { color: theme.textMuted }]}>
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </View>
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
            {body}
          </Text>
          <Text style={[styles.category, { color: meta.color }]}>{meta.categoryLabel}</Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    minHeight: 88,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
    paddingRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  title: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  time: {
    ...Typography.caption,
  },
  description: {
    ...Typography.caption,
  },
  category: {
    ...Typography.caption,
    fontFamily: Typography.small.fontFamily,
    marginTop: 2,
  },
});
