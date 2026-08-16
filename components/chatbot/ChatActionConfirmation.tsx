import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatPendingAction } from '@/domain/models/chatbot';
import { formatWaitTime } from '@/utils/formatting';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type ChatActionConfirmationProps = {
  action: ChatPendingAction;
  disabled?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function ChatActionConfirmation({
  action,
  disabled = false,
  onConfirm,
  onDismiss,
}: ChatActionConfirmationProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const executing = action.status === 'executing';
  const locked = disabled || executing || action.status === 'success';
  const isJoin = action.type === 'join_queue';
  const isDestructive =
    action.type === 'cancel_ticket' ||
    action.type === 'skip_customer' ||
    action.type === 'close_queue';
  const confirmTitle =
    action.labels.confirm ||
    t(isJoin ? 'chatbot.confirmJoin' : 'chatbot.confirmCancel');
  const dismissTitle =
    action.labels.dismiss ||
    t(isJoin ? 'chatbot.dismissJoin' : 'chatbot.dismissCancel');

  return (
    <Card elevated style={styles.card}>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
        {action.organizationName}
      </Text>
      {action.serviceName ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {action.serviceName}
        </Text>
      ) : null}
      {action.ticketNumber ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {t('chatbot.ticketNumber')}: #{action.ticketNumber}
        </Text>
      ) : null}
      {isJoin ? (
        <View style={styles.metrics}>
          {action.waitingCount != null ? (
            <Metric
              label={t('chatbot.waitingCustomers')}
              value={String(action.waitingCount)}
            />
          ) : null}
          {action.estimatedWaitMinutes != null ? (
            <Metric
              label={t('tickets.card.estWait')}
              value={formatWaitTime(action.estimatedWaitMinutes)}
            />
          ) : null}
        </View>
      ) : null}
      {action.status === 'error' && action.errorMessage ? (
        <Text style={[styles.error, { color: Colors.error }]}>{action.errorMessage}</Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          title={confirmTitle}
          onPress={onConfirm}
          loading={executing}
          disabled={locked}
          size="sm"
          variant={isDestructive ? 'danger' : 'primary'}
        />
        <Button
          title={dismissTitle}
          onPress={onDismiss}
          disabled={locked}
          size="sm"
          variant="secondary"
        />
      </View>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.small,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    ...Typography.caption,
  },
  metricValue: {
    ...Typography.bodyMedium,
  },
  error: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
});
