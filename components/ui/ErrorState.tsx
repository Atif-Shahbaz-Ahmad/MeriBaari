import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CloudOff, RefreshCw, WifiOff } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export type ErrorStateVariant = 'generic' | 'network' | 'offline';

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

const COPY_KEYS: Record<ErrorStateVariant, { title: string; description: string }> = {
  generic: {
    title: 'errors.genericTitle',
    description: 'errors.genericBody',
  },
  network: {
    title: 'errors.networkTitle',
    description: 'errors.networkBody',
  },
  offline: {
    title: 'errors.offlineTitle',
    description: 'errors.offlineBody',
  },
};

export function ErrorState({
  variant = 'generic',
  title,
  description,
  onRetry,
  retryLabel,
  style,
}: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const copy = COPY_KEYS[variant];
  const Icon = variant === 'offline' ? WifiOff : variant === 'network' ? CloudOff : RefreshCw;

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={[styles.container, style]}
      accessibilityRole="alert"
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.tints.error.bg }]}>
        <Icon size={28} color={theme.tints.error.fg} strokeWidth={1.75} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title ?? t(copy.title)}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description ?? t(copy.description)}
      </Text>
      {onRetry ? (
        <Button
          title={retryLabel ?? t('errors.tryAgain')}
          onPress={onRetry}
          variant="secondary"
          fullWidth={false}
          leftIcon={<RefreshCw size={16} color={theme.tints.primary.fg} />}
          style={styles.button}
          accessibilityHint={t('errors.retryHint')}
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
