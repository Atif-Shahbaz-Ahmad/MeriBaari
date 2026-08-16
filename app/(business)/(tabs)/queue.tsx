import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Megaphone, PauseCircle, PlayCircle, XCircle } from 'lucide-react-native';

import {
  ActionButton,
  QueueCustomerCard,
  QueueStatusBadge,
} from '@/components/business';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getQueueErrorMessage, QueueError } from '@/domain/errors/queue-error';
import { pushQueueActivity, pushQueueDetails, pushWalkIn } from '@/features/business/navigation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import {
  useCallNext,
  useCloseQueue,
  usePauseQueue,
  useResumeQueue,
  useServeCustomer,
  useSkipCustomer,
  useStartServing,
} from '@/features/queue/hooks/use-queue-mutations';
import {
  useBusinessQueueDetails,
  useBusinessQueues,
  useWaitingCustomers,
} from '@/features/queue/hooks/use-queue-queries';
import { useBusinessQueueRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';

export default function BusinessQueueScreen() {
  const theme = useTheme();
  const { data: organization } = useMyOrganization();
  const {
    data: queues = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useBusinessQueues(organization?.id);
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');

  useEffect(() => {
    if (!selectedQueueId && queues[0]?.id) {
      setSelectedQueueId(queues[0].id);
    }
  }, [queues, selectedQueueId]);

  const queue = useMemo(
    () => queues.find((q) => q.id === selectedQueueId) ?? queues[0],
    [queues, selectedQueueId],
  );

  useBusinessQueueRealtime(organization?.id, queue?.id);

  const { data: customers = [], isFetching: customersLoading } =
    useWaitingCustomers(queue?.id);
  const { data: details } = useBusinessQueueDetails(queue?.id);

  const callNext = useCallNext();
  const startServing = useStartServing();
  const serveCustomer = useServeCustomer();
  const skipCustomer = useSkipCustomer();
  const pauseQueue = usePauseQueue();
  const resumeQueue = useResumeQueue();
  const closeQueue = useCloseQueue();

  const busy =
    callNext.isPending ||
    startServing.isPending ||
    serveCustomer.isPending ||
    skipCustomer.isPending ||
    pauseQueue.isPending ||
    resumeQueue.isPending ||
    closeQueue.isPending;

  if (isLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={4} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          title="Could not load queues"
          description={getQueueErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!queue) {
    return (
      <Screen>
        <EmptyState
          title="No queues yet"
          description="Queues appear automatically when customers join an active service."
        />
      </Screen>
    );
  }

  const runAction = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (e) {
      if (e instanceof QueueError && e.code === 'no_customers_waiting') {
        Alert.alert('Queue clear', 'No customers are waiting.');
        return;
      }
      Alert.alert(label, getQueueErrorMessage(e));
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <SectionHeader
            title="Queue Management"
            subtitle="Call, skip, and complete tickets"
            actionLabel="Details"
            onActionPress={() => pushQueueDetails(queue.id)}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.padded}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.queueChips}>
            {queues.map((item) => {
              const selected = item.id === queue.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedQueueId(item.id)}
                  style={[
                    styles.queueChip,
                    {
                      backgroundColor: selected ? Colors.primary : theme.card,
                      borderColor: selected ? Colors.primary : theme.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.queueChipText,
                      { color: selected ? Colors.textInverse : theme.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.overview}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewTitle}>
                <Text style={[styles.queueName, { color: theme.text }]}>{queue.name}</Text>
                <Text style={[styles.queueService, { color: theme.textSecondary }]}>
                  {queue.departmentName} · {queue.serviceName}
                </Text>
              </View>
              <QueueStatusBadge status={queue.status} size="md" />
            </View>

            <View style={styles.numbers}>
              <View style={styles.numberBlock}>
                <Text style={[styles.numberLabel, { color: theme.textMuted }]}>Current</Text>
                <Text style={[styles.numberValue, { color: Colors.primary }]}>
                  {queue.currentServing}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.numberBlock}>
                <Text style={[styles.numberLabel, { color: theme.textMuted }]}>Next</Text>
                <Text style={[styles.numberValue, { color: theme.text }]}>{queue.nextNumber}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={[styles.metaItem, { backgroundColor: theme.tints.primary.bg }]}>
                <Text style={[styles.metaValue, { color: theme.tints.primary.fg }]}>
                  {queue.waitingCount}
                </Text>
                <Text style={[styles.metaLabel, { color: theme.primary }]}>Waiting</Text>
              </View>
              <View style={[styles.metaItem, { backgroundColor: theme.tints.accent.bg }]}>
                <Text style={[styles.metaValue, { color: theme.tints.accent.fg }]}>
                  {formatWaitTime(queue.averageWaitMinutes)}
                </Text>
                <Text style={[styles.metaLabel, { color: theme.tints.accent.fg }]}>Avg. wait</Text>
              </View>
              <View style={[styles.metaItem, { backgroundColor: theme.tints.secondary.bg }]}>
                <Text style={[styles.metaValue, { color: theme.tints.secondary.fg }]}>
                  {details?.completedToday ?? 0}
                </Text>
                <Text style={[styles.metaLabel, { color: theme.tints.secondary.fg }]}>
                  Served today
                </Text>
              </View>
            </View>

            <View style={styles.toolbar}>
              <ActionButton
                label={callNext.isPending ? 'Calling…' : 'Call Next'}
                icon={<Megaphone size={16} color={Colors.textInverse} />}
                onPress={() =>
                  void runAction('Call next', () => callNext.mutateAsync(queue.id))
                }
                disabled={busy || queue.status !== 'active' || customers.length === 0}
                style={styles.toolbarPrimary}
              />
              {queue.status === 'active' ? (
                <ActionButton
                  label="Pause"
                  variant="neutral"
                  icon={<PauseCircle size={16} color={Colors.primary} />}
                  onPress={() =>
                    void runAction('Pause queue', () => pauseQueue.mutateAsync(queue.id))
                  }
                  disabled={busy}
                />
              ) : queue.status === 'paused' ? (
                <ActionButton
                  label="Resume"
                  variant="neutral"
                  icon={<PlayCircle size={16} color={Colors.primary} />}
                  onPress={() =>
                    void runAction('Resume queue', () => resumeQueue.mutateAsync(queue.id))
                  }
                  disabled={busy}
                />
              ) : (
                <ActionButton
                  label="Reopen"
                  variant="neutral"
                  icon={<PlayCircle size={16} color={Colors.primary} />}
                  onPress={() =>
                    void runAction('Resume queue', () => resumeQueue.mutateAsync(queue.id))
                  }
                  disabled={busy}
                />
              )}
              <ActionButton
                label="Close"
                variant="neutral"
                icon={<XCircle size={16} color={Colors.error} />}
                onPress={() =>
                  void runAction('Close queue', () => closeQueue.mutateAsync(queue.id))
                }
                disabled={busy || queue.status === 'closed'}
              />
              <ActionButton label="Walk-in" variant="neutral" onPress={pushWalkIn} />
              <ActionButton
                label="Activity"
                variant="neutral"
                onPress={() => pushQueueActivity(queue.id)}
              />
            </View>
          </Card>
        </Animated.View>

        <View style={styles.padded}>
          <SectionHeader
            title="Waiting customers"
            subtitle={`${customers.length} in line`}
          />
          {customersLoading && customers.length === 0 ? (
            <LoadingSkeleton count={2} variant="list" />
          ) : customers.length === 0 ? (
            <EmptyState
              title="Queue is clear"
              description="No customers waiting. Customers appear when they join this service."
            />
          ) : (
            customers.map((customer, index) => (
              <QueueCustomerCard
                key={customer.id}
                customer={customer}
                index={index}
                disabled={busy}
                onCall={() =>
                  void runAction('Start serving', () =>
                    startServing.mutateAsync(customer.id),
                  )
                }
                onSkip={() =>
                  void runAction('Skip customer', () =>
                    skipCustomer.mutateAsync(customer.id),
                  )
                }
                onRecall={() =>
                  void runAction('Call customer', () =>
                    startServing.mutateAsync(customer.id),
                  )
                }
                onComplete={() =>
                  void runAction('Serve customer', () =>
                    serveCustomer.mutateAsync(customer.id),
                  )
                }
                onCancel={() =>
                  void runAction('Skip customer', () =>
                    skipCustomer.mutateAsync(customer.id),
                  )
                }
              />
            ))
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
    gap: Spacing.sm,
  },
  queueChips: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  queueChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  queueChipText: {
    ...Typography.small,
  },
  overview: {
    gap: Spacing.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  overviewTitle: {
    flex: 1,
    gap: 2,
  },
  queueName: {
    ...Typography.h2,
  },
  queueService: {
    ...Typography.caption,
  },
  numbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBlock: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  numberLabel: {
    ...Typography.caption,
  },
  numberValue: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.8,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 48,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaItem: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  metaValue: {
    ...Typography.h3,
  },
  metaLabel: {
    ...Typography.caption,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toolbarPrimary: {
    flexGrow: 1,
  },
});
