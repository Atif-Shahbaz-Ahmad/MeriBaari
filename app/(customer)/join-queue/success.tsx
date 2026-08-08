import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { CheckCircle2, Clock3, Ticket } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SecondaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AuthHref } from '@/features/auth/navigation';
import { replaceTicketDetail } from '@/features/tickets/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useJoinQueueStore } from '@/store/join-queue-store';
import { useTicketStore } from '@/store/ticket-store';
import { formatWaitTime } from '@/utils/formatting';

export default function JoinQueueSuccessScreen() {
  const theme = useTheme();
  const reset = useJoinQueueStore((s) => s.reset);
  const lastJoinedTicketId = useTicketStore((s) => s.lastJoinedTicketId);
  const ticket = useTicketStore((s) =>
    s.lastJoinedTicketId ? s.tickets.find((t) => t.id === s.lastJoinedTicketId) : undefined,
  );
  const clearLastJoined = useTicketStore((s) => s.clearLastJoined);

  const goHome = () => {
    reset();
    clearLastJoined();
    router.replace(AuthHref.customerHome);
  };

  const viewTicket = () => {
    if (!lastJoinedTicketId) {
      goHome();
      return;
    }
    reset();
    replaceTicketDetail(lastJoinedTicketId);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Animated.View entering={ZoomIn.duration(450)} style={styles.iconWrap}>
          <CheckCircle2 size={56} color={Colors.secondary} strokeWidth={1.75} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.copy}>
          <Text style={[styles.title, { color: theme.text }]}>You’re in the queue!</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Your ticket is ready. Track your position and we’ll remind you when it’s almost your turn.
          </Text>
        </Animated.View>

        {ticket ? (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.cardWrap}>
            <Card style={styles.ticketCard}>
              <View style={[styles.ticketBadge, { backgroundColor: Colors.secondary50 }]}>
                <Ticket size={18} color={Colors.secondary600} />
                <Text style={[styles.badgeLabel, { color: Colors.secondary600 }]}>Queue number</Text>
              </View>
              <Text style={[styles.ticketNumber, { color: Colors.primary }]}>
                {ticket.ticketNumber}
              </Text>
              <Text style={[styles.org, { color: theme.text }]} numberOfLines={1}>
                {ticket.organizationName}
              </Text>
              <Text style={[styles.service, { color: theme.textSecondary }]} numberOfLines={1}>
                {ticket.departmentName} · {ticket.serviceName}
              </Text>
              <View style={[styles.waitRow, { backgroundColor: Colors.accent50 }]}>
                <Clock3 size={16} color={Colors.accent} />
                <Text style={[styles.waitText, { color: '#B45309' }]}>
                  Est. wait ~{formatWaitTime(ticket.estimatedWaitMinutes)}
                </Text>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeIn.delay(280).duration(400)} style={styles.actions}>
          <PrimaryButton title="View Ticket" onPress={viewTicket} />
          <SecondaryButton title="Back to Home" onPress={goHome} />
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
    backgroundColor: Colors.secondary50,
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
