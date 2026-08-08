import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { History, Ticket } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { FilterTabs } from '@/components/tickets/FilterTabs';
import { TicketCard } from '@/components/tickets/TicketCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { pushJoinQueueList } from '@/features/queue/navigation';
import { pushTicketDetail, pushTicketHistory } from '@/features/tickets/navigation';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import { useTicketStore } from '@/store/ticket-store';

type TicketTab = 'active' | 'completed' | 'cancelled';

export default function TicketsScreen() {
  const theme = useTheme();
  const tickets = useTicketStore((s) => s.tickets);
  const [tab, setTab] = useState<TicketTab>('active');

  const active = useMemo(() => dataAccess.getActiveTickets(tickets), [tickets]);
  const completed = useMemo(() => dataAccess.getCompletedTickets(tickets), [tickets]);
  const cancelled = useMemo(() => dataAccess.getCancelledTickets(tickets), [tickets]);

  const list =
    tab === 'active' ? active : tab === 'completed' ? completed : cancelled;

  const tabs = [
    { key: 'active' as const, label: 'Active', count: active.length },
    { key: 'completed' as const, label: 'Completed', count: completed.length },
    { key: 'cancelled' as const, label: 'Cancelled', count: cancelled.length },
  ];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: theme.text }]}>My Tickets</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Track active queues and past visits
              </Text>
            </View>
            <Pressable
              onPress={pushTicketHistory}
              style={[styles.historyBtn, { backgroundColor: Colors.primary50 }]}
              accessibilityRole="button"
              accessibilityLabel="Ticket history"
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
                  ? 'No active tickets'
                  : tab === 'completed'
                    ? 'No completed tickets'
                    : 'No cancelled tickets'
              }
              description={
                tab === 'active'
                  ? 'Join a queue to get your first MeriBaari ticket.'
                  : 'Tickets in this category will show up here.'
              }
              actionLabel={tab === 'active' ? 'Join a queue' : undefined}
              onActionPress={tab === 'active' ? pushJoinQueueList : undefined}
            />
          ) : (
            <View style={styles.stack}>
              {list.map((ticket, index) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  onPress={() => pushTicketDetail(ticket.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    gap: Spacing.md,
  },
});
