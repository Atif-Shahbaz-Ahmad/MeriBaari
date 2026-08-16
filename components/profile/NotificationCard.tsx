import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PauseCircle,
  PlayCircle,
  Ticket,
  Timer,
  XCircle,
  BellRing,
  CheckCircle2,
  CreditCard,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import type { SemanticTints } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatRelativeTime } from '@/utils/formatting';
import type { AppNotification, NotificationType } from '@/types';

const TYPE_META: Record<
  NotificationType,
  { Icon: typeof BellRing; tint: keyof SemanticTints; categoryKey: string }
> = {
  QUEUE_JOINED: { Icon: Ticket, tint: 'primary', categoryKey: 'notifications.tabQueue' },
  TICKET_CALLED: { Icon: BellRing, tint: 'primary', categoryKey: 'notifications.tabQueue' },
  TICKET_SERVING: { Icon: Timer, tint: 'accent', categoryKey: 'notifications.tabQueue' },
  TICKET_SERVED: { Icon: CheckCircle2, tint: 'secondary', categoryKey: 'notifications.tabQueue' },
  TICKET_SKIPPED: { Icon: XCircle, tint: 'error', categoryKey: 'notifications.tabQueue' },
  QUEUE_PAUSED: { Icon: PauseCircle, tint: 'accent', categoryKey: 'notifications.tabQueue' },
  QUEUE_RESUMED: { Icon: PlayCircle, tint: 'secondary', categoryKey: 'notifications.tabQueue' },
  QUEUE_CLOSED: { Icon: XCircle, tint: 'error', categoryKey: 'notifications.tabQueue' },
  QUEUE_TURN_APPROACHING: { Icon: Timer, tint: 'accent', categoryKey: 'notifications.tabReminders' },
  QUEUE_CANCELLED: { Icon: XCircle, tint: 'error', categoryKey: 'notifications.tabSystem' },
  CUSTOMER_JOINED: { Icon: Ticket, tint: 'secondary', categoryKey: 'notifications.tabQueue' },
  SUBSCRIPTION_PAYMENT_SUBMITTED: {
    Icon: CreditCard,
    tint: 'accent',
    categoryKey: 'notifications.tabSystem',
  },
  SUBSCRIPTION_APPROVED: {
    Icon: CheckCircle2,
    tint: 'secondary',
    categoryKey: 'notifications.tabSystem',
  },
  SUBSCRIPTION_REJECTED: { Icon: XCircle, tint: 'error', categoryKey: 'notifications.tabSystem' },
  SYSTEM: { Icon: BellRing, tint: 'primary', categoryKey: 'notifications.tabSystem' },
};

interface NotificationCardProps {
  notification: AppNotification;
  index?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NotificationCard({
  notification,
  index = 0,
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
}: NotificationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const meta = TYPE_META[notification.type] ?? TYPE_META.SYSTEM;
  const Icon = meta.Icon;
  const tint = theme.tints[meta.tint];
  const isRead = notification.isRead ?? notification.read;
  const body = notification.message ?? notification.description;
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(380)}>
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={`${isRead ? '' : 'Unread. '}${notification.title}. ${body}`}
        accessibilityHint="Double tap to open. Long press for more options."
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPressIn={() => {
          if (isDisabled) return;
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
            borderColor: isRead ? theme.border : theme.tints.primary.border,
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        {!isRead ? <View style={styles.unreadDot} accessibilityElementsHidden /> : null}
        <View style={[styles.icon, { backgroundColor: tint.bg }]}>
          <Icon size={18} color={tint.fg} strokeWidth={2} />
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
          <Text style={[styles.category, { color: tint.fg }]}>
            {t(meta.categoryKey)}
          </Text>
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
