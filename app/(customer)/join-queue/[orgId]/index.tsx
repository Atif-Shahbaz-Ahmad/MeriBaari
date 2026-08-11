import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Building2,
  Car,
  Clock3,
  GraduationCap,
  Hospital,
  Landmark,
  MapPin,
  Phone,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { DepartmentCard } from '@/components/cards/DepartmentCard';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { InfoRow } from '@/components/ui/InfoRow';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { useOrganization } from '@/features/organization/hooks/use-organizations';
import { useDepartments } from '@/features/structure/hooks/use-structure-queries';
import { pushDepartments, pushServices, replaceJoinQueueList } from '@/features/queue/navigation';
import { useJoinQueueStore } from '@/store/join-queue-store';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';

const LOGO_ICONS = {
  hospital: Hospital,
  bank: Building2,
  building: Building2,
  clinic: Stethoscope,
  university: GraduationCap,
  utensils: UtensilsCrossed,
  landmark: Landmark,
  car: Car,
} as const;

export default function OrganizationDetailsScreen() {
  const theme = useTheme();
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const selectDepartment = useJoinQueueStore((s) => s.selectDepartment);
  const {
    data: organization,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrganization(orgId);
  const {
    data: departments = [],
    isLoading: departmentsLoading,
  } = useDepartments(orgId, { activeOnly: true });

  if (isLoading || departmentsLoading) {
    return (
      <Screen>
        <FlowHeader title="Details" onBack={() => router.back()} />
        <LoadingSkeleton count={3} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title="Details" onBack={() => router.back()} />
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
      <Screen>
        <FlowHeader title="Organization" onBack={() => router.back()} />
        <EmptyState
          title="Organization not found"
          description="This place may be inactive or no longer available."
          actionLabel="Back to Discover"
          onActionPress={replaceJoinQueueList}
        />
      </Screen>
    );
  }

  const Icon = LOGO_ICONS[organization.logoIcon] ?? Building2;
  const categoryLabel = getOrganizationCategoryLabel(organization.category);
  const statusLabel = organization.isActive ? 'Open for queues' : 'Temporarily inactive';

  const startJoin = () => {
    selectOrganization(organization.id);
    pushDepartments(organization.id);
  };

  const openDepartment = (departmentId: string) => {
    selectOrganization(organization.id);
    selectDepartment(departmentId);
    pushServices(organization.id);
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <FlowHeader title="Details" onBack={() => router.back()} />
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.banner}>
          <View style={styles.bannerGlow} />
          <View style={styles.logoLarge}>
            {organization.logoUrl ? (
              <Image
                source={{ uri: organization.logoUrl }}
                style={styles.logoImage}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Icon size={40} color={Colors.primary} strokeWidth={1.75} />
            )}
          </View>
          <Text style={styles.bannerName}>{organization.name}</Text>
          <Text style={styles.bannerCategory}>
            {categoryLabel}
            {organization.city ? ` · ${organization.city}` : ''}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.infoCard}>
            <InfoRow
              icon={<MapPin size={16} color={Colors.primary} />}
              label="Address"
              value={
                [organization.address, organization.city].filter(Boolean).join(', ') ||
                'Address not listed'
              }
            />
            {organization.phone ? (
              <InfoRow
                icon={<Phone size={16} color={Colors.primary} />}
                label="Phone"
                value={organization.phone}
              />
            ) : null}
            <InfoRow
              icon={<Clock3 size={16} color={Colors.accent} />}
              label="Status"
              value={statusLabel}
            />
            <InfoRow
              icon={<Clock3 size={16} color={Colors.secondary} />}
              label="Average wait"
              value={
                organization.averageWaitMinutes > 0
                  ? `~${formatWaitTime(organization.averageWaitMinutes)}`
                  : 'Not available yet'
              }
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.padded}>
          <SectionHeader title="About" style={styles.sectionGap} />
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {organization.description || 'No description provided yet.'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
          <SectionHeader
            title="Departments"
            subtitle={
              departments.length > 0
                ? `${departments.length} available`
                : 'No departments available yet'
            }
            style={styles.sectionGap}
          />
          {departments.length === 0 ? (
            <EmptyState
              title="No departments available yet"
              description="This organization has not published any active departments."
            />
          ) : (
            <View style={styles.stack}>
              {departments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  onPress={() => openDepartment(department.id)}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}
      >
        <PrimaryButton
          title="Browse Departments"
          onPress={startJoin}
          disabled={!organization.isActive || departments.length === 0}
        />
        {!organization.isActive ? (
          <Text style={[styles.footerHint, { color: theme.textMuted }]}>
            This organization is currently inactive.
          </Text>
        ) : departments.length === 0 ? (
          <Text style={[styles.footerHint, { color: theme.textMuted }]}>
            Departments are not available yet.
          </Text>
        ) : (
          <Text style={[styles.footerHint, { color: theme.textMuted }]}>
            Select a department to choose a service. Queue joining comes next.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  banner: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  bannerGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -40,
    right: -30,
  },
  logoLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  bannerName: {
    ...Typography.h2,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  bannerCategory: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  infoCard: {
    gap: 0,
  },
  description: {
    ...Typography.body,
  },
  sectionGap: {
    marginBottom: Spacing.md,
  },
  stack: {
    gap: Spacing.md,
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
    gap: Spacing.xs,
  },
  footerHint: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
