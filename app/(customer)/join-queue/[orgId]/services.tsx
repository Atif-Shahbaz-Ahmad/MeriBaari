import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { JoinServiceCard } from '@/components/cards/JoinServiceCard';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';
import {
  JoinQueueHref,
  pushConfirm,
  replaceJoinQueueList,
} from '@/features/queue/navigation';
import { dataAccess } from '@/data';
import { useJoinQueueStore } from '@/store/join-queue-store';

export default function ServiceSelectionScreen() {
  const theme = useTheme();
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const departmentId = useJoinQueueStore((s) => s.departmentId);
  const serviceId = useJoinQueueStore((s) => s.serviceId);
  const selectService = useJoinQueueStore((s) => s.selectService);

  const organization = orgId ? dataAccess.getOrganizationById(orgId) : undefined;
  const department = departmentId ? dataAccess.getDepartmentById(departmentId) : undefined;
  const services = departmentId ? dataAccess.getServicesByDepartment(departmentId) : [];

  if (!organization || !department) {
    return (
      <Screen>
        <FlowHeader title="Select Service" onBack={() => router.back()} />
        <EmptyState
          title="Select a department first"
          description="Go back and choose a department to see available services."
          actionLabel="Choose department"
          onActionPress={() => {
            if (orgId) router.replace(JoinQueueHref.departments(orgId));
            else replaceJoinQueueList();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title="Select Service"
            subtitle={`${organization.name} · ${department.name}`}
            onBack={() => router.back()}
          />
        </Animated.View>

        <View style={styles.padded}>
          <View style={styles.stack}>
            {services.map((service, index) => (
              <Animated.View
                key={service.id}
                entering={FadeInDown.delay(60 + index * 40).duration(400)}
              >
                <JoinServiceCard
                  service={service}
                  selected={serviceId === service.id}
                  onPress={() => selectService(service.id)}
                />
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <PrimaryButton
          title="Continue"
          disabled={!serviceId}
          onPress={pushConfirm}
        />
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
