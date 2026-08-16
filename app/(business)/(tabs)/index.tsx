import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Building2,
  Clock3,
  MapPin,
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
import { ChatFloatingButton } from '@/components/chatbot/ChatFloatingButton';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { LocationMapPreview } from '@/components/organization/LocationMapPreview';
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PAYMENT_CONFIG } from '@/config/payment';
import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { isOrganizationPublic, nextSubscriptionPaymentAt } from '@/domain/models';
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
import { pushBusinessAssistant } from '@/features/chatbot/navigation';
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
import { useTranslation } from '@/hooks/use-translation';
import { dataAccess } from '@/data';
import { hasValidCoords } from '@/lib/geo';
import { pushSubscriptionPay } from '@/features/subscription/navigation';

export default function BusinessDashboardScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
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
          title={t('business.dashboard.loadOrgError')}
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
              <View style={[styles.onboardingIcon, { backgroundColor: theme.tints.primary.bg }]}>
                <Building2 size={32} color={theme.tints.primary.fg} strokeWidth={1.75} />
              </View>
              <Text style={[styles.onboardingTitle, { color: theme.text }]}>
                {t('business.dashboard.createOrgTitle')}
              </Text>
              <Text style={[styles.onboardingBody, { color: theme.textSecondary }]}>
                {t('business.dashboard.createOrgBody')}
              </Text>
              <PrimaryButton
                title={t('business.dashboard.createOrgCta')}
                onPress={pushCreateOrganization}
              />
            </Card>
          </Animated.View>
          <EmptyState
            title={t('business.dashboard.welcomeName', { name })}
            description={t('business.dashboard.welcomeBody')}
          />
        </ScrollView>
      </Screen>
    );
  }

  const categoryLabel = getOrganizationCategoryLabel(organization.category);
  const locationLabel = [organization.city, organization.address]
    .filter(Boolean)
    .join(' · ');
  const hasCoords = hasValidCoords(
    organization.latitude,
    organization.longitude,
  );
  const hasAddressText = Boolean(
    organization.address?.trim() || organization.city?.trim(),
  );
  const missingCoordsWarning = hasAddressText && !hasCoords;

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
                  {organization.isActive
                    ? t('business.dashboard.active')
                    : t('business.dashboard.inactive')}{' '}
                  ·{' '}
                  {organization.description
                    ? organization.description.slice(0, 80) +
                      (organization.description.length > 80 ? '…' : '')
                    : t('business.dashboard.noDescription')}
                </Text>
              </View>
            </View>
            <Text style={styles.greeting}>
              {dataAccess.getBusinessGreeting()}, {name}
            </Text>
            <Text style={styles.date}>{dataAccess.formatBusinessDate()}</Text>
            <Button
              title={t('business.dashboard.manageOrganization')}
              variant="secondary"
              size="sm"
              leftIcon={<Settings2 size={16} color={theme.tints.primary.fg} />}
              onPress={pushEditOrganization}
              style={styles.manageButton}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.padded}>
          <SubscriptionStatusCard
            status={organization.subscriptionStatus}
            visibleToCustomers={isOrganizationPublic(organization)}
            adminHidden={organization.adminHidden}
            adminHiddenReason={organization.adminHiddenReason}
            rejectionReason={organization.paymentRejectionReason}
            cooldownUntil={nextSubscriptionPaymentAt(
              organization.approvedAt,
              PAYMENT_CONFIG.renewalCooldownDays,
            )}
            onSubscribe={pushSubscriptionPay}
            onResubmit={pushSubscriptionPay}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={[styles.locationTitle, { color: theme.text }]}>
                {t('business.dashboard.businessLocation')}
              </Text>
            </View>

            {hasCoords ? (
              <LocationMapPreview
                latitude={organization.latitude}
                longitude={organization.longitude}
                label={organization.name}
                address={organization.address}
                city={organization.city}
              />
            ) : (
              <>
                {organization.address?.trim() ? (
                  <Text style={[styles.locationLine, { color: theme.text }]}>
                    {organization.address.trim()}
                  </Text>
                ) : (
                  <Text style={[styles.locationMuted, { color: theme.textMuted }]}>
                    {t('maps.noStreetAddress')}
                  </Text>
                )}

                {organization.city?.trim() ? (
                  <Text
                    style={[styles.locationLine, { color: theme.textSecondary }]}
                  >
                    {organization.city.trim()}
                  </Text>
                ) : null}
              </>
            )}

            {missingCoordsWarning ? (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: theme.tints.accent.bg, borderColor: theme.tints.accent.border },
                ]}
              >
                <Text style={[styles.warningText, { color: theme.text }]}>
                  {t('business.dashboard.missingCoords')}
                </Text>
                <Button
                  title={t('business.dashboard.addLocation')}
                  variant="outline"
                  size="sm"
                  onPress={pushEditOrganization}
                  fullWidth={false}
                  style={styles.warningAction}
                />
              </View>
            ) : null}

            {!hasCoords && !missingCoordsWarning ? (
              <Button
                title={t('business.dashboard.setLocation')}
                variant="ghost"
                size="sm"
                onPress={pushEditOrganization}
              />
            ) : null}
          </Card>
        </Animated.View>

        <View style={styles.padded}>
          <View style={styles.statsRow}>
            <BusinessStatCard
              label={t('business.dashboard.statActiveQueues')}
              value={queues.filter((q) => q.status === 'active').length}
              icon={<Users size={18} color={theme.tints.primary.fg} />}
              accent="blue"
              index={0}
            />
            <BusinessStatCard
              label={t('business.dashboard.statWaiting')}
              value={waitingFromQueues}
              icon={<Clock3 size={18} color={theme.tints.accent.fg} />}
              accent="orange"
              index={1}
            />
          </View>
          <View style={styles.statsRow}>
            <BusinessStatCard
              label={t('business.dashboard.statOpenServices')}
              value={queues.length}
              icon={<UserCheck size={18} color={theme.tints.secondary.fg} />}
              accent="green"
              index={2}
            />
            <BusinessStatCard
              label={t('business.dashboard.statAvgWait')}
              value={avgWait}
              suffix={t('common.minutesSuffix')}
              icon={<Clock3 size={18} color={theme.tints.primary.fg} />}
              accent="blue"
              index={3}
            />
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
          <SectionHeader title={t('business.dashboard.quickActions')} subtitle={t('business.dashboard.quickActionsSubtitle')} />
          <View style={styles.actions}>
            <QuickActionTile
              label={t('business.dashboard.callNext')}
              icon={<Megaphone size={20} color={theme.tints.primary.fg} />}
              tint="blue"
              loading={callNextMutation.isPending}
              disabled={callNextMutation.isPending}
              onPress={() => {
                if (!selected) {
                  pushQueueTab();
                  return;
                }
                void callNextMutation
                  .mutateAsync(selected.id)
                  .then(() => pushQueueTab())
                    .catch((e) => Alert.alert(t('business.dashboard.alertCallNext'), getQueueErrorMessage(e)));
              }}
            />
            <QuickActionTile
              label={t('business.dashboard.walkIn')}
              icon={<UserPlus size={20} color={theme.tints.secondary.fg} />}
              tint="green"
              onPress={pushWalkIn}
            />
            <QuickActionTile
              label={t('business.dashboard.pauseQueue')}
              icon={<PauseCircle size={20} color={theme.tints.accent.fg} />}
              tint="orange"
              loading={pauseQueueMutation.isPending}
              disabled={!selected || selected.status === 'paused' || pauseQueueMutation.isPending}
              onPress={() => {
                if (!selected) return;
                void pauseQueueMutation
                  .mutateAsync(selected.id)
                  .catch((e) => Alert.alert(t('business.dashboard.alertPauseQueue'), getQueueErrorMessage(e)));
              }}
            />
            <QuickActionTile
              label={t('business.dashboard.resumeQueue')}
              icon={<PlayCircle size={20} color={theme.tints.secondary.fg} />}
              tint="green"
              loading={resumeQueueMutation.isPending}
              disabled={!selected || selected.status === 'active' || resumeQueueMutation.isPending}
              onPress={() => {
                if (!selected) return;
                void resumeQueueMutation
                  .mutateAsync(selected.id)
                  .catch((e) => Alert.alert(t('business.dashboard.alertResumeQueue'), getQueueErrorMessage(e)));
              }}
            />
          </View>
        </Animated.View>

        <View style={styles.padded}>
          <SectionHeader
            title={t('business.dashboard.activeQueues')}
            subtitle={t('business.dashboard.activeQueuesSubtitle')}
            actionLabel={t('business.dashboard.activity')}
            onActionPress={() => pushQueueActivity()}
          />
          {queues.length === 0 ? (
            <EmptyState
              title={t('business.dashboard.noQueuesTitle')}
              description={t('business.dashboard.noQueuesDescription')}
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
              {t('business.dashboard.viewDetails', { name: selected.name })}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <ChatFloatingButton
        onPress={pushBusinessAssistant}
        accessibilityLabel={t('businessChatbot.openA11y')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing['4xl'] + Spacing.xl,
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
  locationCard: {
    gap: Spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationTitle: {
    ...Typography.bodyMedium,
  },
  locationLine: {
    ...Typography.body,
  },
  locationMuted: {
    ...Typography.caption,
  },
  warningBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    ...Typography.caption,
  },
  warningAction: {
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
