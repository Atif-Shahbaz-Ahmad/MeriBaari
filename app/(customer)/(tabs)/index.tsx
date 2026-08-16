import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ChatFloatingButton } from '@/components/chatbot/ChatFloatingButton';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { ProgressCard } from '@/components/cards/ProgressCard';
import { QueueCard } from '@/components/cards/QueueCard';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { QuickActionButton } from '@/components/buttons/QuickActionButton';
import { Screen } from '@/components/layout/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Section } from '@/components/ui/Section';
import { useNearbyOrganizations } from '@/features/home/hooks/use-nearby-organizations';
import { useRecentActivity } from '@/features/home/hooks/use-recent-activity';
import { Spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/use-auth';
import { AuthHref } from '@/features/auth/navigation';
import { pushJoinQueueList, pushOrganization } from '@/features/queue/navigation';
import {
  useMyActiveTicket,
  useTicketProgress,
} from '@/features/queue/hooks/use-queue-queries';
import { useMyTicketsRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { pushFavorites } from '@/features/favorites/navigation';
import { pushCustomerAssistant } from '@/features/chatbot/navigation';
import { pushTicketDetail, pushTicketHistory } from '@/features/tickets/navigation';
import { getGreeting } from '@/utils/formatting';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';
import { useTranslation } from '@/hooks/use-translation';
import { useJoinQueueStore } from '@/store/join-queue-store';
import type { QuickAction } from '@/types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { items: recentActivity, isLoading: activityLoading } = useRecentActivity();
  const { items: nearbyPlaces, isLoading: nearbyLoading } = useNearbyOrganizations();
  const name = user?.fullName?.split(' ')[0] ?? t('common.guest');
  const { data: currentTicket } = useMyActiveTicket();
  const { data: progress } = useTicketProgress(currentTicket?.id);
  useMyTicketsRealtime(currentTicket?.queueId);
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const progressSequence = progress?.timeline.map((t) => t.ticketNumber) ?? [];
  const quickActions: QuickAction[] = useMemo(
    () => [
      { id: 'find', label: t('home.actionFindPlaces'), icon: 'search' },
      { id: 'history', label: t('home.actionHistory'), icon: 'history' },
      { id: 'favorites', label: t('home.actionFavorites'), icon: 'favorites' },
    ],
    [t],
  );

  const openDiscover = () => {
    pushJoinQueueList();
  };

  const openOrganization = (organizationId: string) => {
    selectOrganization(organizationId);
    pushOrganization(organizationId);
  };

  const onQuickAction = (actionId: string) => {
    if (actionId === 'find') {
      openDiscover();
      return;
    }
    if (actionId === 'history') {
      pushTicketHistory();
      return;
    }
    if (actionId === 'favorites') {
      pushFavorites();
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
            title={t('home.nearbyServices')}
            subtitle={t('home.nearbySubtitle')}
            actionLabel={t('home.seeAll')}
            onActionPress={openDiscover}
            style={styles.section}
          >
            {nearbyLoading ? (
              <View style={styles.horizontal}>
                <LoadingSkeleton count={2} variant="list" />
              </View>
            ) : nearbyPlaces.length === 0 ? (
              <EmptyState
                title={t('home.nearbyEmptyTitle')}
                description={t('home.nearbyEmptyDescription')}
                actionLabel={t('home.seeAll')}
                onActionPress={openDiscover}
                style={styles.nearbyEmpty}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontal}
              >
                {nearbyPlaces.map((place) => (
                  <ServiceCard
                    key={place.id}
                    service={place}
                    onPress={() => openOrganization(place.id)}
                  />
                ))}
              </ScrollView>
            )}
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(450)} style={styles.padded}>
          <Section title={t('home.quickActions')}>
            <View style={styles.actions}>
              {quickActions.map((action) => (
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
          <Section title={t('home.recentActivity')}>
            {activityLoading ? (
              <LoadingSkeleton count={3} variant="list" />
            ) : recentActivity.length === 0 ? (
              <EmptyState
                title={t('home.activityEmptyTitle')}
                description={t('home.activityEmptyDescription')}
                style={styles.activityEmpty}
              />
            ) : (
              <View style={styles.stack}>
                {recentActivity.map((item) => (
                  <ActivityCard key={item.id} item={item} />
                ))}
              </View>
            )}
          </Section>
        </Animated.View>
      </ScrollView>
      <ChatFloatingButton onPress={pushCustomerAssistant} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing['4xl'] + Spacing.xl,
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
  activityEmpty: {
    paddingVertical: Spacing.md,
  },
  nearbyEmpty: {
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
  },
});
