import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CloudOff, RefreshCw, WifiOff } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

export type ErrorStateVariant = 'generic' | 'network' | 'offline';

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

const COPY: Record<ErrorStateVariant, { title: string; description: string }> = {
  generic: {
    title: 'Something went wrong',
    description: 'We hit an unexpected issue. Please try again in a moment.',
  },
  network: {
    title: 'Network error',
    description: 'We couldn’t reach MeriBaari services. Check your connection and retry.',
  },
  offline: {
    title: 'No internet',
    description: 'You’re offline. Reconnect to refresh queues and notifications.',
  },
};

export function ErrorState({
  variant = 'generic',
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  style,
}: ErrorStateProps) {
  const theme = useTheme();
  const copy = COPY[variant];
  const Icon = variant === 'offline' ? WifiOff : variant === 'network' ? CloudOff : RefreshCw;

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={[styles.container, style]}
      accessibilityRole="alert"
    >
      <View style={[styles.iconWrap, { backgroundColor: Colors.error50 }]}>
        <Icon size={28} color={Colors.error} strokeWidth={1.75} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title ?? copy.title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description ?? copy.description}
      </Text>
      {onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="secondary"
          fullWidth={false}
          leftIcon={<RefreshCw size={16} color={Colors.primary} />}
          style={styles.button}
          accessibilityHint="Retries the last action"
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
    maxWidth: 300,
  },
  button: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
