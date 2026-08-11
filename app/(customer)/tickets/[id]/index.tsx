import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Activity, Building2, Share2 } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SecondaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { ActiveTicketCard } from '@/components/tickets/ActiveTicketCard';
import { ProgressRing } from '@/components/tickets/ProgressRing';
import { QueueTimeline } from '@/components/tickets/QueueTimeline';
import { ReminderToggle } from '@/components/tickets/ReminderToggle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { dataAccess } from '@/data';
import {
  getQueueErrorMessage,
} from '@/domain/errors/queue-error';
import { pushOrganization } from '@/features/queue/navigation';
import { useCancelQueue } from '@/features/queue/hooks/use-queue-mutations';
import {
  useTicket,
  useTicketProgress,
} from '@/features/queue/hooks/use-queue-queries';
import { useTicketRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { AuthHref } from '@/features/auth/navigation';
import { pushTicketProgress } from '@/features/tickets/navigation';
import { getStatusMeta } from '@/features/tickets/status';
import { useTheme } from '@/hooks/use-theme';
import { useJoinQueueStore } from '@/store/join-queue-store';
import { formatClockTime, formatWaitTime } from '@/utils/formatting';

export default function ActiveTicketScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useTicket(id);
  const { data: progress } = useTicketProgress(id);
  useTicketRealtime(id, ticket?.queueId);
  const cancelQueue = useCancelQueue();
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);

  const statusMeta = ticket ? getStatusMeta(ticket.status) : null;

  const ringProgress = useMemo(() => {
    if (!ticket) return 0.15;
    if (ticket.status === 'serving' || ticket.status === 'completed') return 1;
    if (!progress) {
      const capacity = Math.max(ticket.position + ticket.peopleAhead, 1);
      const served = capacity - ticket.peopleAhead;
      return Math.min(0.95, Math.max(0.08, served / capacity));
    }
    const capacity = Math.max(progress.capacity, ticket.position + ticket.peopleAhead);
    const served = capacity - ticket.peopleAhead;
    return Math.min(0.95, Math.max(0.08, served / capacity));
  }, [ticket, progress]);

  if (isLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={3} variant="ticket" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title="Ticket" onBack={() => router.back()} />
        <ErrorState
          title="Could not load ticket"
          description={getQueueErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!ticket) {
    return (
      <Screen>
        <FlowHeader title="Ticket" onBack={() => router.back()} />
        <EmptyState
          title="Ticket not found"
          description="This ticket may have been removed or the link is invalid."
          actionLabel="My Tickets"
          onActionPress={() => router.replace(AuthHref.customerTickets)}
        />
      </Screen>
    );
  }

  const onShare = async () => {
    try {
      await Share.share({
        message: `MeriBaari ticket ${ticket.ticketNumber} at ${ticket.organizationName} — ${ticket.serviceName}. Currently serving ${ticket.currentServing}. Est. wait ${formatWaitTime(ticket.estimatedWaitMinutes)}.`,
      });
    } catch {
      // user dismissed share sheet
    }
  };

  const onViewOrganization = () => {
    selectOrganization(ticket.organizationId);
    pushOrganization(ticket.organizationId);
  };

  const onCancel = () => {
    Alert.alert('Cancel queue?', 'You will lose your place in line. This cannot be undone.', [
      { text: 'Keep waiting', style: 'cancel' },
      {
        text: 'Cancel queue',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await cancelQueue.mutateAsync(ticket.id);
              Alert.alert('Queue cancelled', 'Your ticket has been cancelled.');
            } catch (e) {
              Alert.alert('Could not cancel', getQueueErrorMessage(e));
            }
          })();
        },
      },
    ]);
  };

  const queueStatusLabel =
    ticket.queueStatus === 'paused'
      ? 'Paused'
      : ticket.queueStatus === 'closed'
        ? 'Closed'
        : 'Open';

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Ticket Details"
            subtitle={ticket.organizationName}
            onBack={() => router.back()}
          />
        </Animated.View>

        <View style={styles.padded}>
          <ActiveTicketCard ticket={ticket} />
        </View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.metaCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
            <Text style={[styles.metaLine, { color: theme.textSecondary }]}>
              Department · {ticket.departmentName}
            </Text>
            <Text style={[styles.metaLine, { color: theme.textSecondary }]}>
              Service · {ticket.serviceName}
            </Text>
            <Text style={[styles.metaLine, { color: theme.textSecondary }]}>
              Queue status · {queueStatusLabel}
            </Text>
            <Text style={[styles.metaLine, { color: theme.textSecondary }]}>
              Joined · {formatClockTime(ticket.joinedAt)}
            </Text>
            <Text style={[styles.metaLine, { color: theme.textSecondary }]}>
              People ahead · {ticket.peopleAhead}
            </Text>
            <Text style={[styles.metaLine, { color: theme.textSecondary }]}>
              Est. wait · {formatWaitTime(ticket.estimatedWaitMinutes)}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.padded}>
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Queue Progress</Text>
              <Button
                title="Details"
                variant="ghost"
                size="sm"
                fullWidth={false}
                leftIcon={<Activity size={16} color={Colors.primary} />}
                onPress={() => pushTicketProgress(ticket.id)}
                style={styles.detailsBtn}
              />
            </View>
            <View style={styles.ringRow}>
              <ProgressRing
                progress={ringProgress}
                value={ticket.peopleAhead === 0 ? 'Now' : String(ticket.peopleAhead)}
                label={ticket.peopleAhead === 0 ? 'Your turn' : 'Ahead'}
                color={
                  ticket.status === 'serving'
                    ? Colors.secondary
                    : ticket.status === 'almost'
                      ? Colors.primary
                      : Colors.accent
                }
              />
              <View style={styles.progressCopy}>
                <Text style={[styles.estLabel, { color: theme.textMuted }]}>
                  Estimated completion
                </Text>
                <Text style={[styles.estValue, { color: theme.text }]}>
                  {ticket.estimatedCompletionAt
                    ? formatClockTime(ticket.estimatedCompletionAt)
                    : '—'}
                </Text>
                {statusMeta ? (
                  <View style={[styles.liveStatus, { backgroundColor: statusMeta.background }]}>
                    <Text style={[styles.liveStatusText, { color: statusMeta.color }]}>
                      {statusMeta.description}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Card>
        </Animated.View>

        {progress ? (
          <View style={styles.padded}>
            <QueueTimeline entries={progress.timeline} />
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
          <Card
            style={{
              ...styles.liveCard,
              borderColor: statusMeta?.color ?? theme.border,
            }}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Status</Text>
            <Text style={[styles.liveBody, { color: theme.textSecondary }]}>
              {statusMeta?.description}
            </Text>
            <View style={styles.liveRow}>
              <Text style={[styles.liveMeta, { color: theme.textMuted }]}>
                Serving {ticket.currentServing}
                {ticket.counter ? ` · Counter ${ticket.counter}` : ''}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {dataAccess.isActiveStatus(ticket.status) ? (
          <View style={styles.padded}>
            <ReminderToggle
              enabled={ticket.reminderEnabled}
              onValueChange={() => {
                // Reminder persistence ships with notifications later.
              }}
            />
          </View>
        ) : null}

        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={[styles.padded, styles.actions]}
        >
          <PrimaryButton
            title="Share Ticket"
            onPress={onShare}
            leftIcon={<Share2 size={18} color={Colors.textInverse} />}
          />
          <SecondaryButton
            title="View Organization"
            onPress={onViewOrganization}
            leftIcon={<Building2 size={18} color={Colors.primary} />}
          />
          {dataAccess.isActiveStatus(ticket.status) ? (
            <Button
              title={cancelQueue.isPending ? 'Cancelling…' : 'Cancel Queue'}
              variant="danger"
              onPress={onCancel}
              loading={cancelQueue.isPending}
              disabled={cancelQueue.isPending}
            />
          ) : null}
        </Animated.View>
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
  },
  metaCard: {
    gap: Spacing.xs,
  },
  metaLine: {
    ...Typography.body,
  },
  progressCard: {
    gap: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.h3,
  },
  detailsBtn: {
    minHeight: 36,
    paddingHorizontal: Spacing.sm,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  progressCopy: {
    flex: 1,
    gap: Spacing.sm,
  },
  estLabel: {
    ...Typography.caption,
  },
  estValue: {
    ...Typography.h2,
  },
  liveStatus: {
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
  },
  liveStatusText: {
    ...Typography.small,
  },
  liveCard: {
    gap: Spacing.sm,
    borderWidth: 1.5,
  },
  liveBody: {
    ...Typography.body,
  },
  liveRow: {
    marginTop: Spacing.xs,
  },
  liveMeta: {
    ...Typography.caption,
  },
  actions: {
    gap: Spacing.sm,
  },
});
