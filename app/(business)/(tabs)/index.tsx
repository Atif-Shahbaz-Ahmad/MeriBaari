import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Building2,
  Clock3,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Settings2,
  UserPlus,
  Users,
  UserCheck,
} from 'lucide-react-native';

import {
  BusinessStatCard,
  QueueOverviewCard,
  QuickActionTile,
} from '@/components/business';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { getQueueErrorMessage } from '@/domain/errors/queue-error';
import {
  pushCreateOrganization,
  pushEditOrganization,
  pushQueueActivity,
  pushQueueDetails,
  pushQueueTab,
  pushWalkIn,
} from '@/features/business/navigation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import {
  useCallNext,
  usePauseQueue,
  useResumeQueue,
} from '@/features/queue/hooks/use-queue-mutations';
import { useBusinessQueues } from '@/features/queue/hooks/use-queue-queries';
import { useBusinessQueueRealtime } from '@/features/queue/hooks/use-queue-realtime';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';

export default function BusinessDashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const name = user?.fullName?.split(' ')[0] ?? 'there';
  const {
    data: organization,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyOrganization();

  const { data: queues = [] } = useBusinessQueues(organization?.id);
  useBusinessQueueRealtime(organization?.id, queues[0]?.id);
  const callNextMutation = useCallNext();
  const pauseQueueMutation = usePauseQueue();
  const resumeQueueMutation = useResumeQueue();

  const selected = queues[0];
  const waitingFromQueues = queues.reduce((sum, q) => sum + q.waitingCount, 0);
  const avgWait =
    queues.length > 0
      ? Math.round(
          queues.reduce((sum, q) => sum + q.averageWaitMinutes, 0) / queues.length,
        )
      : organization?.averageWaitMinutes ?? 0;

  const openQueueOps = (_queueId: string) => {
    pushQueueTab();
  };

  if (isLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={4} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          title="Could not load organization"
          description={getOrganizationErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen padded={false}>
        <ScrollView
          contentContainerStyle={styles.onboardingContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
            <Card style={styles.onboardingCard}>
              <View style={[styles.onboardingIcon, { backgroundColor: Colors.primary50 }]}>
                <Building2 size={32} color={Colors.primary} strokeWidth={1.75} />
              </View>
              <Text style={[styles.onboardingTitle, { color: theme.text }]}>
                Create Your Organization
              </Text>
              <Text style={[styles.onboardingBody, { color: theme.textSecondary }]}>
                Set up your business profile so customers can discover you and join
                your queues. Departments and queues can be added next.
              </Text>
              <PrimaryButton
                title="Create Organization"
                onPress={pushCreateOrganization}
              />
            </Card>
          </Animated.View>
          <EmptyState
            title={`Welcome, ${name}`}
            description="Your business dashboard will appear here after you create an organization."
          />
        </ScrollView>
      </Screen>
    );
  }

  const categoryLabel = getOrganizationCategoryLabel(organization.category);
  const locationLabel = [organization.city, organization.address]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <View style={[styles.hero, { backgroundColor: Colors.primary }]}>
            <View style={styles.heroTop}>
              <Avatar
                name={organization.name}
                uri={organization.logoUrl}
                size={56}
                style={styles.logo}
              />
              <View style={styles.heroCopy}>
                <Text style={styles.orgName}>{organization.name}</Text>
                <Text style={styles.orgMeta}>
                  {categoryLabel}
                  {locationLabel ? ` · ${locationLabel}` : ''}
                </Text>
                <Text style={styles.orgStatus}>
                  {organization.isActive ? 'Active' : 'Inactive'} ·{' '}
                  {organization.description
                    ? organization.description.slice(0, 80) +
                      (organization.description.length > 80 ? '…' : '')
                    : 'No description yet'}
                </Text>
              </View>
            </View>
            <Text style={styles.greeting}>
              {dataAccess.getBusinessGreeting()}, {name}
            </Text>
            <Text style={styles.date}>{dataAccess.formatBusinessDate()}</Text>
            <Button
              title="Manage organization"
              variant="secondary"
              size="sm"
              leftIcon={<Settings2 size={16} color={Colors.primary} />}
              onPress={pushEditOrganization}
              style={styles.manageButton}
            />
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <View style={styles.statsRow}>
            <BusinessStatCard
              label="Active Queues"
              value={queues.filter((q) => q.status === 'active').length}
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
              label="Open Services"
              value={queues.length}
              icon={<UserCheck size={18} color={Colors.secondary600} />}
              accent="green"
              index={2}
            />
            <BusinessStatCard
              label="Avg. Waiting Time"
              value={avgWait}
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
                if (!selected) {
                  pushQueueTab();
                  return;
                }
                void callNextMutation
                  .mutateAsync(selected.id)
                  .then(() => pushQueueTab())
                  .catch((e) => Alert.alert('Call next', getQueueErrorMessage(e)));
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
              onPress={() => {
                if (!selected) return;
                void pauseQueueMutation
                  .mutateAsync(selected.id)
                  .catch((e) => Alert.alert('Pause queue', getQueueErrorMessage(e)));
              }}
            />
            <QuickActionTile
              label="Resume Queue"
              icon={<PlayCircle size={20} color={Colors.secondary600} />}
              tint="green"
              disabled={!selected || selected.status === 'active'}
              onPress={() => {
                if (!selected) return;
                void resumeQueueMutation
                  .mutateAsync(selected.id)
                  .catch((e) => Alert.alert('Resume queue', getQueueErrorMessage(e)));
              }}
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
          {queues.length === 0 ? (
            <EmptyState
              title="No active queues"
              description="Queues are created automatically when customers join your services."
            />
          ) : (
            queues.map((queue, index) => (
              <QueueOverviewCard
                key={queue.id}
                queue={queue}
                index={index}
                onPress={() => openQueueOps(queue.id)}
              />
            ))
          )}
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
  onboardingContent: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  onboardingCard: {
    gap: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  onboardingIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTitle: {
    ...Typography.h2,
    textAlign: 'center',
  },
  onboardingBody: {
    ...Typography.body,
    textAlign: 'center',
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
  orgStatus: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  greeting: {
    ...Typography.h3,
    color: Colors.textInverse,
  },
  date: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.85)',
  },
  manageButton: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
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
