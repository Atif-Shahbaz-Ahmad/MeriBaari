import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  BellOff,
  HeartOff,
  History,
  Inbox,
  SearchX,
  Ticket,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

export type EmptyStatePreset =
  | 'default'
  | 'notifications'
  | 'tickets'
  | 'search'
  | 'history'
  | 'favorites';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  preset?: EmptyStatePreset;
  style?: ViewStyle;
}

const PRESETS: Record<
  EmptyStatePreset,
  { title: string; description: string; Icon: typeof Inbox }
> = {
  default: {
    title: 'Nothing here yet',
    description: 'Content will appear once it’s available.',
    Icon: Inbox,
  },
  notifications: {
    title: 'No notifications',
    description: 'Queue updates and reminders will show up here.',
    Icon: BellOff,
  },
  tickets: {
    title: 'No tickets',
    description: 'Join a queue to get your first MeriBaari ticket.',
    Icon: Ticket,
  },
  search: {
    title: 'No search results',
    description: 'Try a different name, service, or neighborhood.',
    Icon: SearchX,
  },
  history: {
    title: 'No history yet',
    description: 'Completed and cancelled tickets will appear here.',
    Icon: History,
  },
  favorites: {
    title: 'No favorites',
    description: 'Save places you visit often for quicker access.',
    Icon: HeartOff,
  },
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
  icon,
  preset = 'default',
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const config = PRESETS[preset];
  const Icon = config.Icon;

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={[styles.container, style]}
      accessibilityRole="summary"
    >
      <View
        style={[styles.iconWrap, { backgroundColor: Colors.primary50 }]}
        accessibilityElementsHidden
      >
        {icon ?? <Icon size={28} color={Colors.primary} strokeWidth={1.75} />}
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title ?? config.title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description ?? config.description}
      </Text>
      {actionLabel ? (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          variant="secondary"
          fullWidth={false}
          style={styles.button}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  button: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
});
