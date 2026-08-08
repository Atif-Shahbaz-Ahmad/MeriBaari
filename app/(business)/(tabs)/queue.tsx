import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Megaphone } from 'lucide-react-native';

import {
  ActionButton,
  QueueCustomerCard,
  QueueStatusBadge,
} from '@/components/business';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { pushQueueActivity, pushQueueDetails, pushWalkIn } from '@/features/business/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useBusinessQueueStore } from '@/store/business-queue-store';
import { formatWaitTime } from '@/utils/formatting';

export default function BusinessQueueScreen() {
  const theme = useTheme();
  const queues = useBusinessQueueStore((s) => s.queues);
  const selectedQueueId = useBusinessQueueStore((s) => s.selectedQueueId);
  const selectQueue = useBusinessQueueStore((s) => s.selectQueue);
  const getWaitingCustomers = useBusinessQueueStore((s) => s.getWaitingCustomers);
  const callNext = useBusinessQueueStore((s) => s.callNext);
  const callCustomer = useBusinessQueueStore((s) => s.callCustomer);
  const skipCustomer = useBusinessQueueStore((s) => s.skipCustomer);
  const recallCustomer = useBusinessQueueStore((s) => s.recallCustomer);
  const markComplete = useBusinessQueueStore((s) => s.markComplete);
  const cancelTicket = useBusinessQueueStore((s) => s.cancelTicket);

  const queue = queues.find((q) => q.id === selectedQueueId) ?? queues[0];
  const customers = queue ? getWaitingCustomers(queue.id) : [];

  if (!queue) {
    return (
      <Screen>
        <EmptyState title="No queues" description="Create a service queue to start managing customers." />
      </Screen>
    );
  }

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
                  onPress={() => selectQueue(item.id)}
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
              <View style={[styles.metaItem, { backgroundColor: Colors.primary50 }]}>
                <Text style={[styles.metaValue, { color: Colors.primary700 }]}>
                  {queue.waitingCount}
                </Text>
                <Text style={[styles.metaLabel, { color: Colors.primary }]}>Waiting</Text>
              </View>
              <View style={[styles.metaItem, { backgroundColor: Colors.accent50 }]}>
                <Text style={[styles.metaValue, { color: '#B45309' }]}>
                  {formatWaitTime(queue.averageWaitMinutes)}
                </Text>
                <Text style={[styles.metaLabel, { color: '#B45309' }]}>Avg. wait</Text>
              </View>
            </View>

            <View style={styles.toolbar}>
              <ActionButton
                label="Call Next"
                icon={<Megaphone size={16} color={Colors.textInverse} />}
                onPress={() => callNext(queue.id)}
                disabled={queue.status !== 'active' || customers.length === 0}
                style={styles.toolbarPrimary}
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
          {customers.length === 0 ? (
            <EmptyState
              title="Queue is clear"
              description="No customers waiting. Add a walk-in or wait for the next join."
            />
          ) : (
            customers.map((customer, index) => (
              <QueueCustomerCard
                key={customer.id}
                customer={customer}
                index={index}
                onCall={() => callCustomer(customer.id)}
                onSkip={() => skipCustomer(customer.id)}
                onRecall={() => recallCustomer(customer.id)}
                onComplete={() => markComplete(customer.id)}
                onCancel={() => cancelTicket(customer.id)}
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
