import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Gauge, Timer, Users, Zap } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { ProgressRing } from '@/components/tickets/ProgressRing';
import { QueueInfoCard } from '@/components/tickets/QueueInfoCard';
import { QueueTimeline } from '@/components/tickets/QueueTimeline';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  useTicket,
  useTicketProgress,
} from '@/features/queue/hooks/use-queue-queries';
import { useTicketRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useTheme } from '@/hooks/use-theme';
import {
  formatClockTime,
  formatRelativeTime,
  formatWaitTime,
} from '@/utils/formatting';

export default function QueueProgressDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ticket, isLoading: ticketLoading } = useTicket(id);
  const { data: progress, isLoading: progressLoading } = useTicketProgress(id);
  useTicketRealtime(id, ticket?.queueId);

  if (ticketLoading || progressLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={3} variant="ticket" />
      </Screen>
    );
  }

  if (!ticket || !progress) {
    return (
      <Screen>
        <FlowHeader title="Queue Progress" onBack={() => router.back()} />
        <EmptyState
          title="Progress unavailable"
          description="We couldn’t load queue details for this ticket."
          actionLabel="Go back"
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  const ringProgress =
    ticket.status === 'serving'
      ? 1
      : Math.min(
          0.95,
          Math.max(0.1, (progress.capacity - progress.peopleRemaining) / progress.capacity),
        );

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Queue Progress"
            subtitle={ticket.ticketNumber}
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <Card style={styles.hero}>
            <ProgressRing
              progress={ringProgress}
              size={160}
              value={ticket.ticketNumber}
              label="Your ticket"
              color={Colors.primary}
            />
            <View style={styles.heroStats}>
              <HeroStat
                icon={<Users size={16} color={Colors.primary} />}
                label="Position"
                value={`#${progress.currentPosition}`}
              />
              <HeroStat
                icon={<Timer size={16} color={Colors.accent} />}
                label="Remaining"
                value={String(progress.peopleRemaining)}
              />
              <HeroStat
                icon={<Zap size={16} color={Colors.secondary} />}
                label="Speed"
                value={`${progress.queueSpeed}/hr`}
              />
            </View>
          </Card>
        </Animated.View>

        <View style={styles.padded}>
          <QueueInfoCard
            title="Queue information"
            items={[
              { label: 'Capacity', value: String(progress.capacity) },
              {
                label: 'Current position',
                value: String(progress.currentPosition),
                accent: 'primary',
              },
              {
                label: 'People remaining',
                value: String(progress.peopleRemaining),
                accent: 'accent',
              },
              {
                label: 'Avg. service time',
                value: formatWaitTime(progress.averageServiceMinutes),
              },
              {
                label: 'Estimated finish',
                value: formatClockTime(progress.estimatedFinishAt),
                accent: 'secondary',
              },
              {
                label: 'Now serving',
                value: progress.currentServing,
                accent: 'secondary',
              },
              {
                label: 'Queue speed',
                value: `${progress.queueSpeed} / hr`,
              },
              {
                label: 'Last updated',
                value: formatRelativeTime(progress.lastUpdatedAt),
              },
            ]}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.padded}>
          <Card style={styles.viz}>
            <View style={styles.vizHeader}>
              <Gauge size={18} color={Colors.primary} />
              <Text style={[styles.vizTitle, { color: theme.text }]}>Live visualization</Text>
            </View>
            <View style={styles.bars}>
              {progress.timeline.map((entry, index) => {
                const height = entry.isYou ? 72 : entry.isServing ? 64 : entry.isPast ? 36 : 48;
                return (
                  <View key={`${entry.ticketNumber}-${index}`} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: entry.isYou
                            ? Colors.primary
                            : entry.isServing
                              ? Colors.secondary
                              : entry.isPast
                                ? theme.tints.secondary.bgStrong
                                : theme.border,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.barLabel,
                        {
                          color: entry.isYou ? Colors.primary : theme.textMuted,
                        },
                      ]}
                    >
                      {entry.ticketNumber.split('-')[1]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <View style={styles.padded}>
          <QueueTimeline entries={progress.timeline} orientation="horizontal" title="Nearby numbers" />
        </View>

        <View style={styles.padded}>
          <QueueTimeline entries={progress.timeline} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.heroStat, { backgroundColor: theme.background }]}>
      {icon}
      <Text style={[styles.heroValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.heroLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  heroStat: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  heroValue: {
    ...Typography.h3,
  },
  heroLabel: {
    ...Typography.caption,
  },
  viz: {
    gap: Spacing.md,
  },
  vizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vizTitle: {
    ...Typography.h3,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 96,
    gap: Spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bar: {
    width: '70%',
    borderRadius: Radius.sm,
    minHeight: 24,
  },
  barLabel: {
    ...Typography.caption,
  },
});
