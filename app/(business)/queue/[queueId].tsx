import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CheckCircle2,
  Clock3,
  Gauge,
  Users,
  XCircle,
} from 'lucide-react-native';

import {
  ActivityTimeline,
  QueueStatusBadge,
  SummaryCard,
} from '@/components/business';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { pushQueueActivity } from '@/features/business/navigation';
import {
  useBusinessQueueDetails,
} from '@/features/queue/hooks/use-queue-queries';
import { useQueueRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { getContainer } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useQuery } from '@tanstack/react-query';
import { queueQueryKeys } from '@/features/queue/query-keys';
import { formatWaitTime } from '@/utils/formatting';

export default function QueueDetailsScreen() {
  const theme = useTheme();
  const { queueId } = useLocalSearchParams<{ queueId: string }>();
  useQueueRealtime(queueId);
  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: [...queueQueryKeys.detail(queueId ?? ''), 'business'] as const,
    queryFn: () => getContainer().queueService.getBusinessQueue(queueId!),
    enabled: Boolean(queueId),
  });
  const { data: details, isLoading: detailsLoading } =
    useBusinessQueueDetails(queueId);

  if (queueLoading || detailsLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={3} variant="detail" />
      </Screen>
    );
  }

  if (!queue || !details) {
    return (
      <Screen>
        <FlowHeader title="Queue details" onBack={() => router.back()} />
        <EmptyState title="Queue not found" description="This queue may have been removed." />
      </Screen>
    );
  }

  const timeline: import('@/types').BusinessActivityItem[] = [];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <FlowHeader
            title={queue.name}
            subtitle={`${queue.departmentName} · details`}
            onBack={() => router.back()}
          />
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={[styles.servingLabel, { color: theme.textMuted }]}>Now serving</Text>
                <Text style={[styles.servingNumber, { color: Colors.primary }]}>
                  {queue.currentServing}
                </Text>
                <Text style={[styles.next, { color: theme.textSecondary }]}>
                  Next {queue.nextNumber} · ~{formatWaitTime(queue.estimatedWaitMinutes)} wait
                </Text>
              </View>
              <QueueStatusBadge status={queue.status} size="md" />
            </View>
          </Card>
        </Animated.View>

        <View style={styles.padded}>
          <SectionHeader title="Queue statistics" subtitle="Today’s performance" />
          <View style={styles.statsRow}>
            <SummaryCard
              title="Total Waiting"
              value={details.totalWaiting}
              icon={<Users size={16} color={theme.tints.primary.fg} />}
              accent="blue"
              index={0}
            />
            <SummaryCard
              title="Completed Today"
              value={details.completedToday}
              icon={<CheckCircle2 size={16} color={theme.tints.secondary.fg} />}
              accent="green"
              index={1}
            />
          </View>
          <View style={styles.statsRow}>
            <SummaryCard
              title="Cancelled Today"
              value={details.cancelledToday}
              icon={<XCircle size={16} color={theme.tints.error.fg} />}
              accent="red"
              index={2}
            />
            <SummaryCard
              title="Avg. Service"
              value={`${details.averageServiceMinutes} min`}
              icon={<Clock3 size={16} color={theme.tints.accent.fg} />}
              accent="orange"
              index={3}
            />
          </View>
          <SummaryCard
            title="Queue Speed"
            value={`${details.queueSpeed}/hr`}
            subtitle="Tickets served per hour"
            icon={<Gauge size={16} color={theme.tints.primary.fg} />}
            accent="blue"
            index={4}
          />
        </View>

        <View style={styles.padded}>
          <SectionHeader
            title="Recent timeline"
            actionLabel="See all"
            onActionPress={() => pushQueueActivity(queue.id)}
          />
          <ActivityTimeline items={timeline} title="Queue activity" />
        </View>
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
  headerCard: {
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  servingLabel: {
    ...Typography.caption,
  },
  servingNumber: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -1,
  },
  next: {
    ...Typography.body,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
