import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatStatsCard } from '@/domain/models/chatbot';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type ChatStatsResultCardProps = {
  stats: ChatStatsCard;
};

export function ChatStatsResultCard({ stats }: ChatStatsResultCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Card elevated style={styles.card}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t('businessChatbot.statsTitle')}
      </Text>
      <View style={styles.metrics}>
        <Metric label={t('businessChatbot.customers')} value={String(stats.customers)} />
        <Metric label={t('businessChatbot.served')} value={String(stats.served)} />
        <Metric label={t('businessChatbot.skipped')} value={String(stats.skipped)} />
      </View>
      <View style={styles.metrics}>
        <Metric label={t('businessChatbot.cancelled')} value={String(stats.cancelled)} />
        <Metric label={t('businessChatbot.waiting')} value={String(stats.waiting)} />
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
    gap: Spacing.sm,
  },
  title: {
    ...Typography.bodyMedium,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.md,
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
});
