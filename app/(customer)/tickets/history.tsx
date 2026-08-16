import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Clock3, Heart, Hourglass, Ticket } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { FilterTabs } from '@/components/tickets/FilterTabs';
import { HistoryCard } from '@/components/tickets/HistoryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatisticCard } from '@/components/ui/StatisticCard';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { dataAccess } from '@/data';
import { EMPTY_TICKET_STATISTICS } from '@/mock/statistics';
import { getQueueErrorMessage } from '@/domain/errors/queue-error';
import { useCustomerHistory } from '@/features/history/hooks/use-customer-history';
import { useMyTicketStatistics } from '@/features/history/hooks/use-my-ticket-statistics';
import { pushJoinQueueList } from '@/features/queue/navigation';
import { useReviewedTicketIds } from '@/features/reviews/hooks/use-reviews';
import { pushRateTicket, pushTicketDetail } from '@/features/tickets/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

type HistoryFilter = 'all' | 'completed' | 'cancelled' | 'missed';

function isMissedLike(status: string) {
  return status === 'missed' || status === 'skipped';
}

export default function TicketHistoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    data: history = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCustomerHistory();
  const { data: stats = EMPTY_TICKET_STATISTICS } = useMyTicketStatistics();
  const { data: reviewedIds = [] } = useReviewedTicketIds();
  const reviewedSet = useMemo(() => new Set(reviewedIds), [reviewedIds]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const filtered = useMemo(
    () => dataAccess.filterHistoryTickets(history, query, filter),
    [history, query, filter],
  );
  const groups = useMemo(
    () => dataAccess.groupTicketsByDate(filtered),
    [filtered],
  );

  const tabs = [
    { key: 'all' as const, label: t('history.filterAll'), count: history.length },
    {
      key: 'completed' as const,
      label: t('history.filterCompleted'),
      count: history.filter((ticket) => ticket.status === 'completed' || ticket.status === 'served')
        .length,
    },
    {
      key: 'cancelled' as const,
      label: t('history.filterCancelled'),
      count: history.filter((ticket) => ticket.status === 'cancelled').length,
    },
    {
      key: 'missed' as const,
      label: t('history.filterMissed'),
      count: history.filter((ticket) => isMissedLike(ticket.status)).length,
    },
  ];

  if (isLoading) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('history.customer.title')}
            subtitle={t('history.customer.subtitle')}
            onBack={() => router.back()}
          />
        </View>
        <View style={styles.padded}>
          <LoadingSkeleton count={4} variant="ticket" />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('history.customer.title')}
            subtitle={t('history.customer.subtitle')}
            onBack={() => router.back()}
          />
        </View>
        <ErrorState
          title={t('history.customer.loadError')}
          description={getQueueErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={theme.textSecondary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title={t('history.customer.title')}
            subtitle={t('history.customer.subtitle')}
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <View style={styles.stats}>
            <StatisticCard
              label={t('history.statQueuesJoined')}
              value={String(stats.queuesJoined)}
              icon={<Ticket size={16} color={Colors.primary} />}
            />
            <StatisticCard
              label={t('history.statHoursSaved')}
              value={String(stats.hoursSaved)}
              icon={<Hourglass size={16} color={Colors.secondary} />}
            />
          </View>
          <View style={styles.stats}>
            <StatisticCard
              label={t('history.statAvgWait')}
              value={t('common.minutesShort', {
                count: stats.averageWaitingMinutes,
              })}
              icon={<Clock3 size={16} color={Colors.accent} />}
            />
            <StatisticCard
              label={t('history.statFavoritePlace')}
              value={stats.favoriteOrganization.split(' ')[0] ?? stats.favoriteOrganization}
              icon={<Heart size={16} color={Colors.error} />}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.padded}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('history.customer.searchPlaceholder')}
          />
        </Animated.View>

        <View style={styles.padded}>
          <FilterTabs tabs={tabs} activeKey={filter} onChange={setFilter} />
        </View>

        {groups.length === 0 ? (
          <EmptyState
            title={t('history.customer.emptyTitle')}
            description={t('history.customer.emptyDescription')}
            actionLabel={t('tickets.joinQueue')}
            onActionPress={pushJoinQueueList}
          />
        ) : (
          groups.map((group) => (
            <View key={group.title} style={styles.padded}>
              <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>
                {group.title}
              </Text>
              <View style={styles.stack}>
                {group.data.map((ticket, index) => {
                  const completed =
                    ticket.status === 'completed' || ticket.status === 'served';
                  return (
                    <HistoryCard
                      key={ticket.id}
                      ticket={ticket}
                      index={index}
                      onPress={() => pushTicketDetail(ticket.id)}
                      onRatePress={
                        completed
                          ? () => pushRateTicket(ticket.id)
                          : undefined
                      }
                      rated={reviewedSet.has(ticket.id)}
                      rateLabel={t('reviews.rateVisit')}
                      ratedLabel={t('reviews.rated')}
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  groupTitle: {
    ...Typography.small,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stack: {
    gap: Spacing.sm,
  },
});
