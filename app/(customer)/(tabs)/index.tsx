import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ActivityCard } from '@/components/cards/ActivityCard';
import { ProgressCard } from '@/components/cards/ProgressCard';
import { QueueCard } from '@/components/cards/QueueCard';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { QuickActionButton } from '@/components/buttons/QuickActionButton';
import { Screen } from '@/components/layout/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { Section } from '@/components/ui/Section';
import {
  mockNearbyServices,
  mockQuickActions,
  mockRecentActivity,
} from '@/features/home/mock-data';
import { Spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/use-auth';
import { AuthHref } from '@/features/auth/navigation';
import { pushJoinQueueList } from '@/features/queue/navigation';
import {
  useMyActiveTicket,
  useTicketProgress,
} from '@/features/queue/hooks/use-queue-queries';
import { useMyTicketsRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { pushTicketDetail, pushTicketHistory } from '@/features/tickets/navigation';
import { getGreeting } from '@/utils/formatting';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';

export default function HomeScreen() {
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const name = user?.fullName?.split(' ')[0] ?? 'Guest';
  const { data: currentTicket } = useMyActiveTicket();
  const { data: progress } = useTicketProgress(currentTicket?.id);
  useMyTicketsRealtime(currentTicket?.queueId);
  const progressSequence = progress?.timeline.map((t) => t.ticketNumber) ?? [];

  const openDiscover = () => {
    pushJoinQueueList();
  };

  const openOrganization = (_nearbyServiceId: string) => {
    openDiscover();
  };

  const onQuickAction = (actionId: string) => {
    if (actionId === 'qa-2' || actionId === 'qa-1') {
      openDiscover();
      return;
    }
    if (actionId === 'qa-3') {
      pushTicketHistory();
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)} style={styles.padded}>
          <AppHeader
            greeting={getGreeting()}
            name={name}
            notificationCount={unreadCount}
            onNotificationPress={() => router.push(AuthHref.customerNotifications)}
          />
        </Animated.View>

        {currentTicket ? (
          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.padded}>
            <QueueCard
              ticket={currentTicket}
              onPress={() => pushTicketDetail(currentTicket.id)}
            />
          </Animated.View>
        ) : null}

        {currentTicket && progressSequence.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(140).duration(450)} style={styles.padded}>
            <ProgressCard
              currentServing={currentTicket.currentServing}
              counter={currentTicket.counter}
              sequence={progressSequence}
              yourTicket={currentTicket.ticketNumber}
            />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <Section
            title="Nearby Services"
            subtitle="Places near you"
            actionLabel="See all"
            onActionPress={openDiscover}
            style={styles.section}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontal}
            >
              {mockNearbyServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => openOrganization(service.id)}
                />
              ))}
            </ScrollView>
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(450)} style={styles.padded}>
          <Section title="Quick Actions">
            <View style={styles.actions}>
              {mockQuickActions.map((action) => (
                <QuickActionButton
                  key={action.id}
                  action={action}
                  onPress={() => onQuickAction(action.id)}
                />
              ))}
            </View>
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(450)} style={styles.padded}>
          <Section title="Recent Activity">
            <View style={styles.stack}>
              {mockRecentActivity.map((item) => (
                <ActivityCard key={item.id} item={item} />
              ))}
            </View>
          </Section>
        </Animated.View>
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
  },
  section: {
    paddingLeft: Spacing.md,
  },
  horizontal: {
    paddingRight: Spacing.md,
    gap: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  stack: {
    gap: Spacing.sm,
  },
});
