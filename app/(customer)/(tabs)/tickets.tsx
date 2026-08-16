import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { History, Ticket } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { FilterTabs } from '@/components/tickets/FilterTabs';
import { TicketCard } from '@/components/tickets/TicketCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getQueueErrorMessage } from '@/domain/errors/queue-error';
import { pushJoinQueueList } from '@/features/queue/navigation';
import { useMyTickets } from '@/features/queue/hooks/use-queue-queries';
import { useMyTicketsRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { pushTicketDetail, pushTicketHistory } from '@/features/tickets/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { dataAccess } from '@/data';

type TicketTab = 'active' | 'completed' | 'cancelled';

export default function TicketsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: tickets = [], isLoading, isError, error, refetch } = useMyTickets();
  useMyTicketsRealtime();
  const [tab, setTab] = useState<TicketTab>('active');

  const active = useMemo(() => dataAccess.getActiveTickets(tickets), [tickets]);
  const completed = useMemo(
    () => dataAccess.getCompletedTickets(tickets),
    [tickets],
  );
  const cancelled = useMemo(
    () => dataAccess.getCancelledTickets(tickets),
    [tickets],
  );

  const list =
    tab === 'active' ? active : tab === 'completed' ? completed : cancelled;

  const tabs = [
    { key: 'active' as const, label: t('tickets.tabActive'), count: active.length },
    {
      key: 'completed' as const,
      label: t('tickets.tabCompleted'),
      count: completed.length,
    },
    {
      key: 'cancelled' as const,
      label: t('tickets.tabCancelled'),
      count: cancelled.length,
    },
  ];

  if (isLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={4} variant="ticket" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          title={t('tickets.loadError')}
          description={getQueueErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: theme.text }]}>{t('tickets.title')}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('tickets.subtitle')}
              </Text>
            </View>
            <Pressable
              onPress={pushTicketHistory}
              style={[styles.historyBtn, { backgroundColor: theme.tints.primary.bg }]}
              accessibilityRole="button"
              accessibilityLabel={t('tickets.historyA11y')}
            >
              <History size={18} color={Colors.primary} strokeWidth={2} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <FilterTabs tabs={tabs} activeKey={tab} onChange={setTab} />
        </Animated.View>

        <View style={styles.padded}>
          {list.length === 0 ? (
            <EmptyState
              icon={<Ticket size={28} color={Colors.primary} strokeWidth={1.75} />}
              title={
                tab === 'active'
                  ? t('tickets.emptyActive')
                  : tab === 'completed'
                    ? t('tickets.emptyCompleted')
                    : t('tickets.emptyCancelled')
              }
              description={
                tab === 'active'
                  ? t('tickets.emptyActiveHint')
                  : t('tickets.emptyCategoryHint')
              }
              actionLabel={tab === 'active' ? t('tickets.joinQueue') : undefined}
              onActionPress={tab === 'active' ? pushJoinQueueList : undefined}
            />
          ) : (
            list.map((ticket, index) => (
              <Animated.View
                key={ticket.id}
                entering={FadeInDown.delay(80 + index * 40).duration(350)}
              >
                <TicketCard
                  ticket={ticket}
                  onPress={() => pushTicketDetail(ticket.id)}
                />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
