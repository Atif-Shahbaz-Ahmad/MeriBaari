import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight, Plus } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { SectionTitle } from '@/components/profile/SectionTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import {
  pushCreateDepartment,
  pushCreateOrganization,
  pushDepartmentDetails,
} from '@/features/business/navigation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useDepartments } from '@/features/structure/hooks/use-structure-queries';
import { useServices } from '@/features/structure/hooks/use-structure-queries';
import { useTheme } from '@/hooks/use-theme';
import type { Department } from '@/domain/models';

function DepartmentRow({
  department,
  onPress,
}: {
  department: Department;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { data: services = [] } = useServices(department.id, {
    activeOnly: false,
  });

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={[styles.name, { color: theme.text }]}>
              {department.name}
            </Text>
            {department.description ? (
              <Text
                style={[styles.meta, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {department.description}
              </Text>
            ) : null}
            <Text style={[styles.meta, { color: theme.textMuted }]}>
              {services.length} service{services.length === 1 ? '' : 's'} · Order{' '}
              {department.displayOrder}
            </Text>
          </View>
          <View style={styles.trailing}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: department.isActive
                    ? Colors.secondary50
                    : Colors.error50,
                },
              ]}
            >
              <Text
                style={{
                  ...Typography.caption,
                  color: department.isActive
                    ? Colors.secondary600
                    : Colors.error,
                }}
              >
                {department.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function BusinessServicesScreen() {
  const theme = useTheme();
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
  } = useDepartments(organization?.id, { activeOnly: false });

  if (orgLoading || (organization && deptLoading)) {
    return (
      <Screen>
        <LoadingSkeleton count={4} />
      </Screen>
    );
  }

  if (orgError) {
    return (
      <Screen>
        <ErrorState
          description={getStructureErrorMessage(orgErr)}
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
          description="Departments and services belong to your organization."
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <SectionTitle
            title="Departments"
            subtitle="Organize services your customers can join"
          />
          <Button
            title="Add department"
            leftIcon={<Plus size={16} color={Colors.textInverse} />}
            onPress={pushCreateDepartment}
          />
        </Animated.View>

        <View style={styles.padded}>
          {departments.length === 0 ? (
            <EmptyState
              title="No departments yet"
              description="Create your first department to start adding services."
              actionLabel="Add department"
              onActionPress={pushCreateDepartment}
            />
          ) : (
            departments.map((department, index) => (
              <Animated.View
                key={department.id}
                entering={FadeInDown.delay(60 + index * 40).duration(380)}
              >
                <DepartmentRow
                  department={department}
                  onPress={() => pushDepartmentDetails(department.id)}
                />
              </Animated.View>
            ))
          )}
        </View>

        {departments.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.padded}
          >
            <PrimaryButton
              title="Add another department"
              onPress={pushCreateDepartment}
            />
            <Text style={[styles.note, { color: theme.textMuted }]}>
              Tap a department to manage its services.
            </Text>
          </Animated.View>
        ) : null}
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
  card: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  name: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.caption,
  },
  pill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  note: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
