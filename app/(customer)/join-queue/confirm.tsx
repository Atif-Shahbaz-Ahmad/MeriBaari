import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BellRing, Clock3, Users } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SecondaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { InfoRow } from '@/components/ui/InfoRow';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useJoinQueueSelection } from '@/features/queue/hooks/use-join-queue-selection';
import { replaceJoinQueueList, replaceSuccess } from '@/features/queue/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTicketStore } from '@/store/ticket-store';
import { formatWaitTime } from '@/utils/formatting';

export default function JoinQueueConfirmScreen() {
  const theme = useTheme();
  const { organization, department, service, isComplete } = useJoinQueueSelection();
  const joinQueue = useTicketStore((s) => s.joinQueue);

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

  const onConfirm = () => {
    joinQueue({ organization, department, service });
    replaceSuccess();
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Confirm & Join"
            subtitle="Review your queue selection"
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.summary}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Queue summary</Text>

            <InfoRow label="Organization" value={organization.name} />
            <InfoRow label="Department" value={department.name} />
            <InfoRow label="Service" value={service.name} />
            <InfoRow
              icon={<Clock3 size={16} color={Colors.accent} />}
              label="Estimated wait"
              value={`~${formatWaitTime(service.averageWaitMinutes)}`}
            />
            <InfoRow
              icon={<Users size={16} color={Colors.primary} />}
              label="People ahead"
              value={String(service.peopleAhead)}
            />
            <InfoRow
              icon={<Clock3 size={16} color={Colors.secondary} />}
              label="Service duration"
              value={`~${formatWaitTime(service.estimatedDurationMinutes)}`}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.padded}>
          <View style={[styles.reminder, { backgroundColor: Colors.primary50, borderColor: Colors.primary100 }]}>
            <BellRing size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={[styles.reminderText, { color: Colors.primary700 }]}>
              We’ll send a notification when your turn is approaching so you can arrive on time.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <SecondaryButton title="Back" onPress={() => router.back()} />
        <PrimaryButton title="Confirm & Join Queue" onPress={onConfirm} />
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
