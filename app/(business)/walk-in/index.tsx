import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { WalkInForm } from '@/components/business';
import { KeyboardForm } from '@/components/layout/KeyboardForm';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Spacing } from '@/constants/spacing';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import {
  pushCreateDepartment,
  pushCreateOrganization,
  replaceWalkInSuccess,
} from '@/features/business/navigation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import {
  useDepartments,
  useServices,
} from '@/features/structure/hooks/use-structure-queries';
import { useBusinessQueueStore } from '@/store/business-queue-store';
import type { WalkInDraft } from '@/types';

const INITIAL: WalkInDraft = {
  customerName: '',
  phone: '',
  departmentId: '',
  departmentName: '',
  serviceId: '',
  serviceName: '',
  priority: 'normal',
};

export default function WalkInScreen() {
  const addWalkIn = useBusinessQueueStore((s) => s.addWalkIn);
  const [draft, setDraft] = useState<WalkInDraft>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: organization,
    isLoading: orgLoading,
    isError: orgError,
    error: orgErr,
    refetch: refetchOrg,
  } = useMyOrganization();

  const {
    data: departments = [],
    isLoading: deptLoading,
    isError: deptError,
    error: deptErr,
    refetch: refetchDepts,
  } = useDepartments(organization?.id, { activeOnly: true });

  const {
    data: services = [],
    isLoading: servicesLoading,
    isError: servicesError,
    error: servicesErr,
    refetch: refetchServices,
  } = useServices(draft.departmentId || undefined, {
    activeOnly: true,
    enabled: Boolean(draft.departmentId),
  });

  // Keep selection valid when org departments load or change.
  useEffect(() => {
    if (!departments.length) {
      if (draft.departmentId) {
        setDraft((prev) => ({
          ...prev,
          departmentId: '',
          departmentName: '',
          serviceId: '',
          serviceName: '',
        }));
      }
      return;
    }

    const selected = departments.find((d) => d.id === draft.departmentId);
    if (!selected) {
      const first = departments[0];
      setDraft((prev) => ({
        ...prev,
        departmentId: first.id,
        departmentName: first.name,
        serviceId: '',
        serviceName: '',
      }));
      return;
    }

    if (selected.name !== draft.departmentName) {
      setDraft((prev) => ({ ...prev, departmentName: selected.name }));
    }
  }, [departments, draft.departmentId, draft.departmentName]);

  // Keep service selection valid for the selected department.
  useEffect(() => {
    if (!draft.departmentId || servicesLoading) return;

    if (!services.length) {
      if (draft.serviceId) {
        setDraft((prev) => ({ ...prev, serviceId: '', serviceName: '' }));
      }
      return;
    }

    const selected = services.find((s) => s.id === draft.serviceId);
    if (!selected) {
      const first = services[0];
      setDraft((prev) => ({
        ...prev,
        serviceId: first.id,
        serviceName: first.name,
      }));
      return;
    }

    if (selected.name !== draft.serviceName) {
      setDraft((prev) => ({ ...prev, serviceName: selected.name }));
    }
  }, [
    services,
    servicesLoading,
    draft.departmentId,
    draft.serviceId,
    draft.serviceName,
  ]);

  const onSubmit = () => {
    setSubmitting(true);
    try {
      addWalkIn(draft);
      replaceWalkInSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  if (orgLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={3} variant="detail" />
      </Screen>
    );
  }

  if (orgError) {
    return (
      <Screen>
        <ErrorState
          description={getOrganizationErrorMessage(orgErr)}
          onRetry={() => void refetchOrg()}
        />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen>
        <EmptyState
          title="Create your organization first"
          description="Walk-in tickets are scoped to your current business."
          actionLabel="Create Organization"
          onActionPress={pushCreateOrganization}
        />
      </Screen>
    );
  }

  if (deptError) {
    return (
      <Screen>
        <ErrorState
          description={getStructureErrorMessage(deptErr)}
          onRetry={() => void refetchDepts()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardForm contentContainerStyle={styles.content}>
        <View style={styles.padded}>
          <FlowHeader
            title="Add walk-in"
            subtitle={`${organization.name} · Issue a queue number at the counter`}
            onBack={() => router.back()}
          />
        </View>

        {servicesError ? (
          <View style={styles.padded}>
            <ErrorState
              description={getStructureErrorMessage(servicesErr)}
              onRetry={() => void refetchServices()}
            />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.padded}>
            <WalkInForm
              value={draft}
              onChange={setDraft}
              onSubmit={onSubmit}
              submitting={submitting}
              departments={departments}
              services={services}
              departmentsLoading={deptLoading}
              servicesLoading={servicesLoading}
              onAddDepartment={pushCreateDepartment}
            />
          </Animated.View>
        )}
      </KeyboardForm>
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
    gap: Spacing.sm,
  },
});
