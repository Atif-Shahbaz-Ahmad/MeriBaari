import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BellRing,
  CheckCircle2,
  Clock3,
  MapPin,
  Megaphone,
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
  turn_soon: { Icon: Timer, color: Colors.accent, bg: Colors.accent50, categoryLabel: 'Reminder' },
  turn_next: { Icon: BellRing, color: Colors.primary, bg: Colors.primary50, categoryLabel: 'Queue' },
  queue_delayed: { Icon: Clock3, color: Colors.accent, bg: Colors.accent50, categoryLabel: 'Queue' },
  queue_completed: {
    Icon: CheckCircle2,
    color: Colors.secondary,
    bg: Colors.secondary50,
    categoryLabel: 'Queue',
  },
  counter_changed: {
    Icon: Ticket,
    color: Colors.primary,
    bg: Colors.primary50,
    categoryLabel: 'Queue',
  },
  queue_cancelled: { Icon: XCircle, color: Colors.error, bg: Colors.error50, categoryLabel: 'System' },
  org_nearby: { Icon: MapPin, color: Colors.secondary, bg: Colors.secondary50, categoryLabel: 'Promo' },
  joined: { Icon: Ticket, color: Colors.primary, bg: Colors.primary50, categoryLabel: 'Queue' },
  reminder: { Icon: BellRing, color: Colors.accent, bg: Colors.accent50, categoryLabel: 'Reminder' },
  promo: { Icon: Megaphone, color: Colors.primary, bg: Colors.primary50, categoryLabel: 'Promo' },
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
  const meta = TYPE_META[notification.type];
  const Icon = meta.Icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(380)}>
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`${notification.read ? '' : 'Unread. '}${notification.title}. ${notification.description}`}
        accessibilityHint="Double tap to mark as read. Long press for more options."
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
            borderColor: notification.read ? theme.border : Colors.primary100,
          },
        ]}
      >
        {!notification.read ? <View style={styles.unreadDot} accessibilityElementsHidden /> : null}
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
                  fontFamily: notification.read
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
            {notification.description}
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
