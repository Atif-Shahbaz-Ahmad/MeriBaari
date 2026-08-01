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
  mockCurrentTicket,
  mockNearbyServices,
  mockProgressSequence,
  mockQuickActions,
  mockRecentActivity,
} from '@/features/home/mock-data';
import { Spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/use-auth';
import { getGreeting } from '@/utils/formatting';

export default function HomeScreen() {
  const { user } = useAuth();
  const name = user?.fullName?.split(' ')[0] ?? 'Guest';

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
            notificationCount={2}
            onNotificationPress={() => router.push('/(tabs)/notifications')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.padded}>
          <QueueCard ticket={mockCurrentTicket} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(450)} style={styles.padded}>
          <ProgressCard
            currentServing={mockCurrentTicket.currentServing}
            counter={mockCurrentTicket.counter}
            sequence={mockProgressSequence}
            yourTicket={mockCurrentTicket.ticketNumber}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <Section title="Nearby Services" subtitle="Places near you" style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontal}
            >
              {mockNearbyServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </ScrollView>
          </Section>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(450)} style={styles.padded}>
          <Section title="Quick Actions">
            <View style={styles.actions}>
              {mockQuickActions.map((action) => (
                <QuickActionButton key={action.id} action={action} />
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
