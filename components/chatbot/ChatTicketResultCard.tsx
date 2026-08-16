import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatTicketCard } from '@/domain/models/chatbot';
import { formatWaitTime } from '@/utils/formatting';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import type { QueueStatus } from '@/types';

type ChatTicketResultCardProps = {
  ticket: ChatTicketCard;
  onOpen?: () => void;
};

const BADGE_STATUSES: ReadonlySet<string> = new Set([
  'waiting',
  'almost',
  'called',
  'serving',
  'cancelled',
  'completed',
  'skipped',
  'served',
  'missed',
]);

export function ChatTicketResultCard({ ticket, onOpen }: ChatTicketResultCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cancelled = ticket.status === 'cancelled';
  const badgeStatus = BADGE_STATUSES.has(ticket.status)
    ? (ticket.status as QueueStatus)
    : null;

  return (
    <Card elevated style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.org, { color: theme.text }]} numberOfLines={1}>
          {ticket.organizationName}
        </Text>
        {badgeStatus ? <StatusBadge status={badgeStatus} /> : null}
      </View>
      <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
        {ticket.serviceName}
        {ticket.departmentName ? ` · ${ticket.departmentName}` : ''}
      </Text>
      {cancelled ? (
        <Text style={[styles.ticketNo, { color: theme.text }]}>
          {t('chatbot.ticketNumber')}: #{ticket.ticketNumber}
        </Text>
      ) : (
        <>
          <View style={styles.metrics}>
            <Metric label={t('chatbot.ticketNumber')} value={ticket.ticketNumber} />
            <Metric
              label={t('tickets.card.peopleAhead')}
              value={String(ticket.peopleAhead)}
            />
            <Metric
              label={t('tickets.card.estWait')}
              value={formatWaitTime(ticket.estimatedWaitMinutes)}
            />
          </View>
          <Text style={[styles.serving, { color: Colors.primary }]}>
            {t('tickets.card.nowServing')}: {ticket.currentServing}
          </Text>
        </>
      )}
      {onOpen ? (
        <Button
          title={t('chatbot.viewTicket')}
          onPress={onOpen}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  org: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  meta: {
    ...Typography.small,
  },
  ticketNo: {
    ...Typography.bodyMedium,
    marginTop: Spacing.xs,
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
  serving: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  action: {
    marginTop: Spacing.sm,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
});
