import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Building2,
  Car,
  Clock3,
  GraduationCap,
  Hospital,
  Landmark,
  MapPin,
  Star,
  Stethoscope,
  Users,
  UtensilsCrossed,
} from 'lucide-react-native';

import { DepartmentCard } from '@/components/cards/DepartmentCard';
import { JoinServiceCard } from '@/components/cards/JoinServiceCard';
import { Screen } from '@/components/layout/Screen';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { InfoRow } from '@/components/ui/InfoRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatisticCard } from '@/components/ui/StatisticCard';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { pushDepartments, replaceJoinQueueList } from '@/features/queue/navigation';
import { dataAccess } from '@/data';
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

  const organization = orgId ? dataAccess.getOrganizationById(orgId) : undefined;

  if (!organization) {
    return (
      <Screen>
        <FlowHeader title="Organization" onBack={() => router.back()} />
        <EmptyState
          title="Organization not found"
          description="This place may have been removed from the mock catalog."
          actionLabel="Back to Discover"
          onActionPress={replaceJoinQueueList}
        />
      </Screen>
    );
  }

  const Icon = LOGO_ICONS[organization.logoIcon] ?? Building2;
  const departments = dataAccess.getDepartmentsByOrganization(organization.id);
  const popularServices = dataAccess.getServicesByIds(organization.popularServiceIds);

  const startJoin = () => {
    selectOrganization(organization.id);
    pushDepartments(organization.id);
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
            <Icon size={40} color={Colors.primary} strokeWidth={1.75} />
          </View>
          <Text style={styles.bannerName}>{organization.name}</Text>
          <Text style={styles.bannerCategory}>
            {organization.category.charAt(0).toUpperCase() + organization.category.slice(1)} ·{' '}
            {organization.city}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
          <Card style={styles.infoCard}>
            <InfoRow
              icon={<MapPin size={16} color={Colors.primary} />}
              label="Address"
              value={`${organization.address}, ${organization.city}`}
            />
            <InfoRow
              icon={<Clock3 size={16} color={Colors.accent} />}
              label="Working hours"
              value={organization.workingHours}
            />
            <InfoRow
              icon={<Clock3 size={16} color={Colors.secondary} />}
              label="Average wait"
              value={`~${formatWaitTime(organization.averageWaitMinutes)}`}
            />
            <InfoRow
              icon={<Users size={16} color={Colors.primary} />}
              label="Live queues"
              value={`${organization.liveQueueCount} people`}
            />
            <InfoRow
              icon={<Star size={16} color={Colors.secondary} />}
              label="Rating"
              value={`${organization.rating.toFixed(1)} (${organization.reviewCount})`}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.padded}>
          <SectionHeader title="About" style={styles.sectionGap} />
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {organization.description}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
          <SectionHeader title="Today at a glance" style={styles.sectionGap} />
          <View style={styles.stats}>
            <StatisticCard
              label="Current visitors"
              value={String(organization.currentVisitors)}
              icon={<Users size={16} color={Colors.primary} />}
            />
            <StatisticCard
              label="Avg service"
              value={formatWaitTime(organization.averageServiceMinutes)}
              icon={<Clock3 size={16} color={Colors.accent} />}
            />
            <StatisticCard
              label="Today's visitors"
              value={String(organization.todaysVisitors)}
              icon={<Users size={16} color={Colors.secondary} />}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.padded}>
          <SectionHeader
            title="Departments"
            subtitle={`${departments.length} available`}
            style={styles.sectionGap}
          />
          <View style={styles.stack}>
            {departments.slice(0, 4).map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                onPress={startJoin}
              />
            ))}
          </View>
        </Animated.View>

        {popularServices.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.padded}>
            <SectionHeader title="Popular services" style={styles.sectionGap} />
            <View style={styles.stack}>
              {popularServices.map((service) => (
                <JoinServiceCard key={service.id} service={service} onPress={startJoin} />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <PrimaryButton title="Join Queue" onPress={startJoin} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
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
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  },
});
