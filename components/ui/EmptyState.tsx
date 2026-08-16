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
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

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
  { titleKey: string; descriptionKey: string; Icon: typeof Inbox }
> = {
  default: {
    titleKey: 'empty.defaultTitle',
    descriptionKey: 'empty.defaultDescription',
    Icon: Inbox,
  },
  notifications: {
    titleKey: 'empty.notificationsTitle',
    descriptionKey: 'empty.notificationsDescription',
    Icon: BellOff,
  },
  tickets: {
    titleKey: 'empty.ticketsTitle',
    descriptionKey: 'empty.ticketsDescription',
    Icon: Ticket,
  },
  search: {
    titleKey: 'empty.searchTitle',
    descriptionKey: 'empty.searchDescription',
    Icon: SearchX,
  },
  history: {
    titleKey: 'empty.historyTitle',
    descriptionKey: 'empty.historyDescription',
    Icon: History,
  },
  favorites: {
    titleKey: 'empty.favoritesTitle',
    descriptionKey: 'empty.favoritesDescription',
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
  const { t } = useTranslation();
  const config = PRESETS[preset];
  const Icon = config.Icon;

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={[styles.container, style]}
      accessibilityRole="summary"
    >
      <View
        style={[styles.iconWrap, { backgroundColor: theme.tints.primary.bg }]}
        accessibilityElementsHidden
      >
        {icon ?? <Icon size={28} color={theme.tints.primary.fg} strokeWidth={1.75} />}
      </View>
      <Text style={[styles.title, { color: theme.text }]}>
        {title ?? t(config.titleKey)}
      </Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description ?? t(config.descriptionKey)}
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
