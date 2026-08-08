import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Clock3,
  Megaphone,
  PauseCircle,
  PlayCircle,
  UserPlus,
  Users,
  UserCheck,
} from 'lucide-react-native';

import {
  BusinessStatCard,
  QueueOverviewCard,
  QuickActionTile,
} from '@/components/business';
import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import {
  pushQueueActivity,
  pushQueueDetails,
  pushQueueTab,
  pushWalkIn,
} from '@/features/business/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import { useBusinessQueueStore } from '@/store/business-queue-store';

const MOCK_BUSINESS_DASHBOARD_STATS = dataAccess.MOCK_BUSINESS_DASHBOARD_STATS;
const MOCK_BUSINESS_ORG = dataAccess.MOCK_BUSINESS_ORG;

export default function BusinessDashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const name = user?.fullName?.split(' ')[0] ?? 'there';
  const queues = useBusinessQueueStore((s) => s.queues);
  const selectedQueueId = useBusinessQueueStore((s) => s.selectedQueueId);
  const selectQueue = useBusinessQueueStore((s) => s.selectQueue);
  const callNext = useBusinessQueueStore((s) => s.callNext);
  const setQueueStatus = useBusinessQueueStore((s) => s.setQueueStatus);

  const selected = queues.find((q) => q.id === selectedQueueId) ?? queues[0];
  const stats = MOCK_BUSINESS_DASHBOARD_STATS;
  const waitingFromQueues = queues.reduce((sum, q) => sum + q.waitingCount, 0);

  const openQueueOps = (queueId: string) => {
    selectQueue(queueId);
    pushQueueTab();
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <View style={[styles.hero, { backgroundColor: Colors.primary }]}>
            <View style={styles.heroTop}>
              <Avatar name={MOCK_BUSINESS_ORG.name} size={56} style={styles.logo} />
              <View style={styles.heroCopy}>
                <Text style={styles.orgName}>{MOCK_BUSINESS_ORG.name}</Text>
                <Text style={styles.orgMeta}>
                  {MOCK_BUSINESS_ORG.categoryLabel} · {MOCK_BUSINESS_ORG.location}
                </Text>
              </View>
            </View>
            <Text style={styles.greeting}>
              {dataAccess.getBusinessGreeting()}, {name}
            </Text>
            <Text style={styles.date}>{dataAccess.formatBusinessDate()}</Text>
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <View style={styles.statsRow}>
            <BusinessStatCard
              label="Today's Customers"
              value={stats.todaysCustomers}
              icon={<Users size={18} color={Colors.primary} />}
              accent="blue"
              index={0}
            />
            <BusinessStatCard
              label="Customers Waiting"
              value={waitingFromQueues}
              icon={<Clock3 size={18} color={Colors.accent} />}
              accent="orange"
              index={1}
            />
          </View>
          <View style={styles.statsRow}>
            <BusinessStatCard
              label="Customers Served"
              value={stats.customersServed}
              icon={<UserCheck size={18} color={Colors.secondary600} />}
              accent="green"
              index={2}
            />
            <BusinessStatCard
              label="Avg. Waiting Time"
              value={stats.averageWaitingMinutes}
              suffix=" min"
              icon={<Clock3 size={18} color={Colors.primary} />}
              accent="blue"
              index={3}
            />
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
          <SectionHeader title="Quick actions" subtitle="Control your active queue" />
          <View style={styles.actions}>
            <QuickActionTile
              label="Call Next"
              icon={<Megaphone size={20} color={Colors.primary} />}
              tint="blue"
              onPress={() => {
                if (selected) {
                  selectQueue(selected.id);
                  callNext(selected.id);
                  pushQueueTab();
                }
              }}
            />
            <QuickActionTile
              label="Add Walk-in Customer"
              icon={<UserPlus size={20} color={Colors.secondary600} />}
              tint="green"
              onPress={pushWalkIn}
            />
            <QuickActionTile
              label="Pause Queue"
              icon={<PauseCircle size={20} color="#B45309" />}
              tint="orange"
              disabled={!selected || selected.status === 'paused'}
              onPress={() => selected && setQueueStatus(selected.id, 'paused')}
            />
            <QuickActionTile
              label="Resume Queue"
              icon={<PlayCircle size={20} color={Colors.secondary600} />}
              tint="green"
              disabled={!selected || selected.status === 'active'}
              onPress={() => selected && setQueueStatus(selected.id, 'active')}
            />
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <SectionHeader
            title="Current active queues"
            subtitle="Tap a queue to manage it"
            actionLabel="Activity"
            onActionPress={() => pushQueueActivity()}
          />
          {queues.map((queue, index) => (
            <QueueOverviewCard
              key={queue.id}
              queue={queue}
              index={index}
              onPress={() => openQueueOps(queue.id)}
            />
          ))}
          {selected ? (
            <Text
              style={[styles.detailsLink, { color: Colors.primary }]}
              onPress={() => pushQueueDetails(selected.id)}
            >
              View details for {selected.name} →
            </Text>
          ) : null}
        </View>
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
    gap: Spacing.sm,
  },
  hero: {
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  logo: {
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  orgName: {
    ...Typography.h2,
    color: Colors.textInverse,
  },
  orgMeta: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  greeting: {
    ...Typography.h3,
    color: Colors.textInverse,
  },
  date: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.85)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  detailsLink: {
    ...Typography.small,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
