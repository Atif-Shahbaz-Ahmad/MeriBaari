import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatQueueStatusCard } from '@/domain/models/chatbot';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type ChatQueueStatusCardViewProps = {
  card: ChatQueueStatusCard;
};

export function ChatQueueStatusCardView({ card }: ChatQueueStatusCardViewProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const statusLabel =
    card.status === 'paused'
      ? t('businessChatbot.queuePaused')
      : card.status === 'closed'
        ? t('businessChatbot.queueClosed')
        : t('businessChatbot.queueOpen');

  return (
    <Card elevated style={styles.card}>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {card.serviceName || card.queueName}
      </Text>
      {card.departmentName ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {card.departmentName}
        </Text>
      ) : null}
      <View style={styles.metrics}>
        <Metric label={t('businessChatbot.waiting')} value={String(card.waitingCount)} />
        <Metric
          label={t('businessChatbot.serving')}
          value={card.currentlyServing ?? '—'}
        />
        <Metric label={t('businessChatbot.queue')} value={statusLabel} />
      </View>
      <Text style={[styles.next, { color: Colors.primary }]}>
        {t('businessChatbot.next')}: {card.nextCustomer ?? '—'}
      </Text>
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
  next: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
});
