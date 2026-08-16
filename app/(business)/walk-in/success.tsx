import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { CheckCircle2, Clock3, Ticket } from 'lucide-react-native';

import { PrimaryButton, SecondaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { pushQueueTab, replaceBusinessHome } from '@/features/business/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useBusinessQueueStore } from '@/store/business-queue-store';
import { formatWaitTime } from '@/utils/formatting';

export default function WalkInSuccessScreen() {
  const theme = useTheme();
  const lastWalkIn = useBusinessQueueStore((s) => s.lastWalkIn);
  const clearLastWalkIn = useBusinessQueueStore((s) => s.clearLastWalkIn);
  const selectQueue = useBusinessQueueStore((s) => s.selectQueue);

  const goHome = () => {
    clearLastWalkIn();
    replaceBusinessHome();
  };

  const manageQueue = () => {
    if (lastWalkIn) selectQueue(lastWalkIn.queueId);
    clearLastWalkIn();
    pushQueueTab();
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Animated.View entering={ZoomIn.duration(450)} style={[styles.iconWrap, { backgroundColor: theme.tints.secondary.bg }]}>
          <CheckCircle2 size={56} color={Colors.secondary} strokeWidth={1.75} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.copy}>
          <Text style={[styles.title, { color: theme.text }]}>Added to queue</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Walk-in customer has been issued a queue number. Share it at the counter.
          </Text>
        </Animated.View>

        {lastWalkIn ? (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.cardWrap}>
            <Card style={styles.ticketCard}>
              <View style={[styles.ticketBadge, { backgroundColor: theme.tints.secondary.bg }]}>
                <Ticket size={18} color={theme.tints.secondary.fg} />
                <Text style={[styles.badgeLabel, { color: theme.tints.secondary.fg }]}>Queue number</Text>
              </View>
              <Text style={[styles.ticketNumber, { color: Colors.primary }]}>
                {lastWalkIn.ticketNumber}
              </Text>
              <Text style={[styles.org, { color: theme.text }]} numberOfLines={1}>
                {lastWalkIn.queueName}
              </Text>
              <Text style={[styles.service, { color: theme.textSecondary }]} numberOfLines={1}>
                {lastWalkIn.departmentName} · {lastWalkIn.serviceName}
              </Text>
              <View style={[styles.waitRow, { backgroundColor: theme.tints.accent.bg }]}>
                <Clock3 size={16} color={theme.tints.accent.fg} />
                <Text style={[styles.waitText, { color: theme.tints.accent.fg }]}>
                  Position {lastWalkIn.position} · ~{formatWaitTime(lastWalkIn.estimatedWaitMinutes)}
                </Text>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeIn.delay(280).duration(400)} style={styles.actions}>
          <PrimaryButton title="Manage Queue" onPress={manageQueue} />
          <SecondaryButton title="Back to Dashboard" onPress={goHome} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  cardWrap: {
    width: '100%',
  },
  ticketCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  badgeLabel: {
    ...Typography.small,
  },
  ticketNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -1,
  },
  org: {
    ...Typography.h3,
    textAlign: 'center',
  },
  service: {
    ...Typography.body,
    textAlign: 'center',
  },
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  waitText: {
    ...Typography.small,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
