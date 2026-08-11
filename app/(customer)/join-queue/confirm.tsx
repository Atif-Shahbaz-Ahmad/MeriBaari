import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCircle2, Clock3, Users } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SecondaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { InfoRow } from '@/components/ui/InfoRow';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  getQueueErrorMessage,
  QueueError,
} from '@/domain/errors/queue-error';
import { useJoinQueue } from '@/features/queue/hooks/use-queue-mutations';
import { useQueueJoinPreview } from '@/features/queue/hooks/use-queue-queries';
import { useJoinPreviewRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useJoinQueueSelection } from '@/features/queue/hooks/use-join-queue-selection';
import {
  replaceJoinQueueList,
  replaceSuccess,
} from '@/features/queue/navigation';
import { replaceTicketDetail } from '@/features/tickets/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useLastJoinedTicketStore } from '@/store/last-joined-ticket-store';
import { formatWaitTime } from '@/utils/formatting';

export default function JoinQueueConfirmScreen() {
  const theme = useTheme();
  const { organization, department, service, isComplete } =
    useJoinQueueSelection();
  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
    error: previewErr,
    refetch,
  } = useQueueJoinPreview(service?.id);
  useJoinPreviewRealtime(preview?.queueId ?? undefined, service?.id);
  const joinQueue = useJoinQueue();
  const setLastJoinedTicketId = useLastJoinedTicketStore(
    (s) => s.setLastJoinedTicketId,
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isComplete || !organization || !department || !service) {
    return (
      <Screen>
        <FlowHeader title="Confirm" onBack={() => router.back()} />
        <EmptyState
          title="Incomplete selection"
          description="Choose an organization, department, and service before confirming."
          actionLabel="Browse organizations"
          onActionPress={replaceJoinQueueList}
        />
      </Screen>
    );
  }

  const onConfirmJoin = async () => {
    if (submitting || joinQueue.isPending) return;
    if (preview && !preview.canJoin) {
      Alert.alert(
        'Queue unavailable',
        preview.queueStatus === 'paused'
          ? 'This queue is paused. Please try again later.'
          : 'This queue is closed and not accepting customers.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await joinQueue.mutateAsync({
        serviceId: service.id,
        organization,
        department,
        service,
      });
      setLastJoinedTicketId(ticket.id);
      replaceSuccess();
    } catch (error) {
      if (error instanceof QueueError && error.code === 'already_joined') {
        Alert.alert('Already in queue', 'You are already in this queue.', [
          {
            text: 'View ticket',
            onPress: () => {
              if (error.existingTicketId) {
                replaceTicketDetail(error.existingTicketId);
              }
            },
          },
          { text: 'OK', style: 'cancel' },
        ]);
        return;
      }
      Alert.alert('Could not join queue', getQueueErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const waitingCount = preview?.waitingCount ?? 0;
  const estimatedWait =
    preview?.estimatedWaitMinutes ?? waitingCount * (service.durationMinutes || 10);
  const currentServing = preview?.currentServing ?? '—';
  const isBusy = submitting || joinQueue.isPending;

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Confirm join"
            subtitle="Review before joining the queue"
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={styles.padded}
        >
          <Card style={styles.summary}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              Queue summary
            </Text>

            <InfoRow label="Organization" value={organization.name} />
            <InfoRow label="Department" value={department.name} />
            <InfoRow label="Service" value={service.name} />
            <InfoRow
              icon={<Users size={16} color={Colors.primary} />}
              label="Currently serving"
              value={currentServing}
            />
            <InfoRow
              icon={<Users size={16} color={Colors.accent} />}
              label="People waiting"
              value={
                previewLoading ? '…' : String(waitingCount)
              }
            />
            <InfoRow
              icon={<Clock3 size={16} color={Colors.accent} />}
              label="Estimated wait"
              value={
                previewLoading ? '…' : `~${formatWaitTime(estimatedWait)}`
              }
            />
          </Card>
        </Animated.View>

        {previewLoading ? (
          <View style={styles.padded}>
            <LoadingSkeleton count={1} variant="ticket" />
          </View>
        ) : null}

        {previewError ? (
          <View style={styles.padded}>
            <ErrorState
              title="Could not load queue"
              description={getQueueErrorMessage(previewErr)}
              onRetry={() => void refetch()}
            />
          </View>
        ) : null}

        <Animated.View
          entering={FadeInDown.delay(120).duration(400)}
          style={styles.padded}
        >
          <View
            style={[
              styles.reminder,
              {
                backgroundColor: Colors.primary50,
                borderColor: Colors.primary100,
              },
            ]}
          >
            <CheckCircle2 size={20} color={Colors.primary} />
            <Text style={[styles.reminderText, { color: theme.textSecondary }]}>
              Your ticket is created only after you confirm. You can cancel while
              waiting if your plans change.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}
      >
        <PrimaryButton
          title={isBusy ? 'Joining…' : 'Confirm Join Queue'}
          onPress={() => void onConfirmJoin()}
          disabled={isBusy || Boolean(preview && !preview.canJoin)}
          loading={isBusy}
        />
        <SecondaryButton
          title="Cancel"
          onPress={() => router.back()}
          disabled={isBusy}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 160,
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  summary: {
    gap: Spacing.xs,
  },
  summaryTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  reminder: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  reminderText: {
    ...Typography.body,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
});
