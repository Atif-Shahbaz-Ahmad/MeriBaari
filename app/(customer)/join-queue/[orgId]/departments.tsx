import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DepartmentCard } from '@/components/cards/DepartmentCard';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Spacing } from '@/constants/spacing';
import { pushServices, replaceJoinQueueList } from '@/features/queue/navigation';
import { dataAccess } from '@/data';
import { useJoinQueueStore } from '@/store/join-queue-store';

export default function DepartmentSelectionScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const selectDepartment = useJoinQueueStore((s) => s.selectDepartment);

  const organization = orgId ? dataAccess.getOrganizationById(orgId) : undefined;
  const departments = orgId ? dataAccess.getDepartmentsByOrganization(orgId) : [];

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Select Department"
            subtitle={organization.name}
            onBack={() => router.back()}
          />
        </Animated.View>

        <View style={styles.padded}>
          <View style={styles.stack}>
            {departments.map((department, index) => (
              <Animated.View
                key={department.id}
                entering={FadeInDown.delay(60 + index * 40).duration(400)}
              >
                <DepartmentCard
                  department={department}
                  onPress={() => onSelect(department.id)}
                />
              </Animated.View>
            ))}
          </View>
        </View>
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
