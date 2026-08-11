import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Clock3, Heart, Hourglass, Ticket } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { FilterTabs } from '@/components/tickets/FilterTabs';
import { HistoryCard } from '@/components/tickets/HistoryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatisticCard } from '@/components/ui/StatisticCard';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { pushJoinQueueList } from '@/features/queue/navigation';
import { pushTicketDetail } from '@/features/tickets/navigation';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import { useMyTickets } from '@/features/queue/hooks/use-queue-queries';
import { useMyTicketsRealtime } from '@/features/queue/hooks/use-queue-realtime';

type HistoryFilter = 'all' | 'completed' | 'cancelled' | 'missed';

export default function TicketHistoryScreen() {
  const theme = useTheme();
  const { data: tickets = [] } = useMyTickets();
  useMyTicketsRealtime();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const stats = useMemo(() => dataAccess.computeTicketStatistics(tickets), [tickets]);
  const history = useMemo(() => dataAccess.getHistoryTickets(tickets), [tickets]);
  const filtered = useMemo(
    () => dataAccess.filterHistoryTickets(history, query, filter),
    [history, query, filter],
  );
  const groups = useMemo(() => dataAccess.groupTicketsByDate(filtered), [filtered]);

  const tabs = [
    { key: 'all' as const, label: 'All', count: history.length },
    {
      key: 'completed' as const,
      label: 'Completed',
      count: history.filter((t) => t.status === 'completed').length,
    },
    {
      key: 'cancelled' as const,
      label: 'Cancelled',
      count: history.filter((t) => t.status === 'cancelled').length,
    },
    {
      key: 'missed' as const,
      label: 'Missed',
      count: history.filter((t) => t.status === 'missed').length,
    },
  ];

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Ticket History"
            subtitle="Past queues and visits"
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <View style={styles.stats}>
            <StatisticCard
              label="Queues Joined"
              value={String(stats.queuesJoined)}
              icon={<Ticket size={16} color={Colors.primary} />}
            />
            <StatisticCard
              label="Hours Saved"
              value={String(stats.hoursSaved)}
              icon={<Hourglass size={16} color={Colors.secondary} />}
            />
          </View>
          <View style={styles.stats}>
            <StatisticCard
              label="Avg. Wait"
              value={`${stats.averageWaitingMinutes} min`}
              icon={<Clock3 size={16} color={Colors.accent} />}
            />
            <StatisticCard
              label="Favorite Place"
              value={stats.favoriteOrganization.split(' ')[0] ?? stats.favoriteOrganization}
              icon={<Heart size={16} color={Colors.error} />}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.padded}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search tickets, places, services…"
          />
        </Animated.View>

        <View style={styles.padded}>
          <FilterTabs tabs={tabs} activeKey={filter} onChange={setFilter} />
        </View>

        {groups.length === 0 ? (
          <EmptyState
            title="No history yet"
            description="Completed and cancelled tickets will appear here."
            actionLabel="Join a queue"
            onActionPress={pushJoinQueueList}
          />
        ) : (
          groups.map((group) => (
            <View key={group.title} style={styles.padded}>
              <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{group.title}</Text>
              <View style={styles.stack}>
                {group.data.map((ticket, index) => (
                  <HistoryCard
                    key={ticket.id}
                    ticket={ticket}
                    index={index}
                    onPress={() => pushTicketDetail(ticket.id)}
                  />
                ))}
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
