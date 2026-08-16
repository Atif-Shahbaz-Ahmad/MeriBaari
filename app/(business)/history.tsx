import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { History } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { FilterTabs } from '@/components/tickets/FilterTabs';
import { HistoryCard } from '@/components/tickets/HistoryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { dataAccess } from '@/data';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { getQueueErrorMessage } from '@/domain/errors/queue-error';
import { pushCreateOrganization, pushQueueTab } from '@/features/business/navigation';
import { useOwnerHistory } from '@/features/history/hooks/use-owner-history';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useTheme } from '@/hooks/use-theme';

type HistoryFilter = 'all' | 'completed' | 'cancelled' | 'missed';

function isMissedLike(status: string) {
  return status === 'missed' || status === 'skipped';
}

/**
 * DB-backed ticket history for the business owner.
 * Separate from `activity.tsx` (in-memory queue ops timeline).
 */
export default function BusinessHistoryScreen() {
  const theme = useTheme();
  const {
    data: organization,
    isLoading: orgLoading,
    isError: orgError,
    error: orgErr,
    refetch: refetchOrg,
  } = useMyOrganization();
  const {
    data: history = [],
    isLoading: historyLoading,
    isError: historyError,
    error: historyErr,
    refetch: refetchHistory,
    isRefetching,
  } = useOwnerHistory(organization?.id);

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
    { key: 'all' as const, label: 'All', count: history.length },
    {
      key: 'completed' as const,
      label: 'Completed',
      count: history.filter((t) => t.status === 'completed' || t.status === 'served')
        .length,
    },
    {
      key: 'cancelled' as const,
      label: 'Cancelled',
      count: history.filter((t) => t.status === 'cancelled').length,
    },
    {
      key: 'missed' as const,
      label: 'Missed',
      count: history.filter((t) => isMissedLike(t.status)).length,
    },
  ];

  const isLoading = orgLoading || (Boolean(organization?.id) && historyLoading);
  const refetch = async () => {
    await Promise.all([refetchOrg(), refetchHistory()]);
  };

  if (isLoading) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title="History"
            subtitle="Past tickets for your business"
            onBack={() => router.back()}
          />
        </View>
        <View style={styles.padded}>
          <LoadingSkeleton count={4} variant="ticket" />
        </View>
      </Screen>
    );
  }

  if (orgError) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title="History"
            subtitle="Past tickets for your business"
            onBack={() => router.back()}
          />
        </View>
        <ErrorState
          title="Could not load organization"
          description={getOrganizationErrorMessage(orgErr)}
          onRetry={() => void refetchOrg()}
        />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title="History"
            subtitle="Past tickets for your business"
            onBack={() => router.back()}
          />
        </View>
        <EmptyState
          icon={<History size={28} color={Colors.primary} strokeWidth={1.75} />}
          title="No organization yet"
          description="Create your business to start collecting ticket history."
          actionLabel="Create organization"
          onActionPress={pushCreateOrganization}
        />
      </Screen>
    );
  }

  if (historyError) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title="History"
            subtitle="Past tickets for your business"
            onBack={() => router.back()}
          />
        </View>
        <ErrorState
          title="Could not load history"
          description={getQueueErrorMessage(historyErr)}
          onRetry={() => void refetchHistory()}
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
            refreshing={isRefetching && !historyLoading}
            onRefresh={() => void refetch()}
            tintColor={theme.textSecondary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="History"
            subtitle={`${organization.name} · past tickets`}
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search ticket #, service, department…"
          />
        </Animated.View>

        <View style={styles.padded}>
          <FilterTabs tabs={tabs} activeKey={filter} onChange={setFilter} />
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon={<History size={28} color={Colors.primary} strokeWidth={1.75} />}
            title="No history yet"
            description="Completed, cancelled, and missed tickets will appear here."
            actionLabel="Open queues"
            onActionPress={pushQueueTab}
          />
        ) : (
          groups.map((group) => (
            <View key={group.title} style={styles.padded}>
              <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>
                {group.title}
              </Text>
              <View style={styles.stack}>
                {group.data.map((ticket, index) => (
                  <HistoryCard key={ticket.id} ticket={ticket} index={index} />
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
