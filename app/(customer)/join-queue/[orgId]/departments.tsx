import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DepartmentCard } from '@/components/cards/DepartmentCard';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Spacing } from '@/constants/spacing';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import { useOrganization } from '@/features/organization/hooks/use-organizations';
import { useDepartments } from '@/features/structure/hooks/use-structure-queries';
import { pushServices, replaceJoinQueueList } from '@/features/queue/navigation';
import { useJoinQueueStore } from '@/store/join-queue-store';

export default function DepartmentSelectionScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const selectDepartment = useJoinQueueStore((s) => s.selectDepartment);
  const {
    data: organization,
    isLoading: orgLoading,
    isError: orgError,
    error: orgErr,
    refetch: refetchOrg,
  } = useOrganization(orgId);
  const {
    data: departments = [],
    isLoading: deptLoading,
    isError: deptError,
    error: deptErr,
    refetch: refetchDepts,
  } = useDepartments(orgId, { activeOnly: true });

  if (orgLoading || deptLoading) {
    return (
      <Screen>
        <FlowHeader title="Select Department" onBack={() => router.back()} />
        <LoadingSkeleton count={3} />
      </Screen>
    );
  }

  if (orgError) {
    return (
      <Screen>
        <FlowHeader title="Select Department" onBack={() => router.back()} />
        <ErrorState
          description={getOrganizationErrorMessage(orgErr)}
          onRetry={() => void refetchOrg()}
        />
      </Screen>
    );
  }

  if (deptError) {
    return (
      <Screen>
        <FlowHeader title="Select Department" onBack={() => router.back()} />
        <ErrorState
          description={getStructureErrorMessage(deptErr)}
          onRetry={() => void refetchDepts()}
        />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen>
        <FlowHeader title="Select Department" onBack={() => router.back()} />
        <EmptyState
          title="Organization not found"
          actionLabel="Back to Discover"
          onActionPress={replaceJoinQueueList}
        />
      </Screen>
    );
  }

  const onSelect = (departmentId: string) => {
    selectOrganization(organization.id);
    selectDepartment(departmentId);
    pushServices(organization.id);
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Select Department"
            subtitle={organization.name}
            onBack={() => router.back()}
          />
        </Animated.View>

        {departments.length === 0 ? (
          <EmptyState
            title="No departments available yet"
            description="This organization has not published any active departments."
            actionLabel="Back to details"
            onActionPress={() => router.back()}
          />
        ) : (
          <Animated.View
            entering={FadeInDown.delay(80).duration(400)}
            style={styles.padded}
          >
            <View style={styles.stack}>
              {departments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  onPress={() => onSelect(department.id)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
  },
  stack: {
    gap: Spacing.md,
  },
});
