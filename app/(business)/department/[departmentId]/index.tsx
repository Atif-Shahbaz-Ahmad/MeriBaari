import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import {
  pushCreateService,
  pushEditDepartment,
  pushEditService,
} from '@/features/business/navigation';
import {
  useDeleteDepartment,
  useDeleteService,
  useToggleDepartmentStatus,
  useToggleServiceStatus,
} from '@/features/structure/hooks/use-structure-mutations';
import {
  useDepartment,
  useServices,
} from '@/features/structure/hooks/use-structure-queries';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return 'No price';
  return `Rs ${price.toFixed(0)}`;
}

export default function DepartmentDetailsScreen() {
  const theme = useTheme();
  const { departmentId } = useLocalSearchParams<{ departmentId: string }>();
  const {
    data: department,
    isLoading,
    isError,
    error,
    refetch,
  } = useDepartment(departmentId);
  const {
    data: services = [],
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useServices(departmentId, { activeOnly: false });

  const toggleDepartment = useToggleDepartmentStatus();
  const deleteDepartment = useDeleteDepartment();
  const toggleService = useToggleServiceStatus();
  const deleteService = useDeleteService();

  if (isLoading || servicesLoading) {
    return (
      <Screen>
        <FlowHeader title="Department" onBack={() => router.back()} />
        <LoadingSkeleton count={3} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title="Department" onBack={() => router.back()} />
        <ErrorState
          description={getStructureErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!department) {
    return (
      <Screen>
        <FlowHeader title="Department" onBack={() => router.back()} />
        <EmptyState
          title="Department not found"
          description="This department may have been removed or is no longer available."
          actionLabel="Back"
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  const onToggleDepartment = () => {
    Alert.alert(
      department.isActive ? 'Deactivate department?' : 'Activate department?',
      department.isActive
        ? 'Customers will no longer see this department.'
        : 'Customers will be able to see this department again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: department.isActive ? 'Deactivate' : 'Activate',
          style: department.isActive ? 'destructive' : 'default',
          onPress: () => {
            void toggleDepartment.mutateAsync({
              id: department.id,
              activate: !department.isActive,
            });
          },
        },
      ],
    );
  };

  const onDeleteDepartment = () => {
    Alert.alert(
      'Delete department?',
      'This also removes its services. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteDepartment.mutateAsync(department.id);
              router.back();
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <FlowHeader
            title={department.name}
            subtitle={
              department.isActive
                ? 'Visible to customers'
                : 'Hidden from customers'
            }
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
          <Card style={styles.summary}>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {department.description || 'No description'}
            </Text>
            <Text style={[styles.meta, { color: theme.textMuted }]}>
              Order {department.displayOrder} · Icon {department.icon}
            </Text>
            <View style={styles.actions}>
              <Button
                title="Edit"
                variant="outline"
                size="sm"
                leftIcon={<Pencil size={14} color={Colors.primary} />}
                onPress={() => pushEditDepartment(department.id)}
                fullWidth={false}
              />
              <Button
                title={department.isActive ? 'Deactivate' : 'Activate'}
                variant="secondary"
                size="sm"
                onPress={onToggleDepartment}
                loading={toggleDepartment.isPending}
                fullWidth={false}
              />
              <Button
                title="Delete"
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={14} color={Colors.textInverse} />}
                onPress={onDeleteDepartment}
                loading={deleteDepartment.isPending}
                fullWidth={false}
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.padded}>
          <SectionHeader
            title="Services"
            subtitle={`${services.length} total`}
            actionLabel="Add"
            onActionPress={() => pushCreateService(department.id)}
          />

          {services.length === 0 ? (
            <EmptyState
              title="No services yet"
              description="Add services customers can select in this department."
              actionLabel="Add service"
              onActionPress={() => pushCreateService(department.id)}
            />
          ) : (
            <View style={styles.stack}>
              {services.map((service) => (
                <Pressable
                  key={service.id}
                  onPress={() => pushEditService(department.id, service.id)}
                >
                  <Card style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <Text style={[styles.serviceName, { color: theme.text }]}>
                        {service.name}
                      </Text>
                      <View
                        style={[
                          styles.pill,
                          {
                            backgroundColor: service.isActive
                              ? theme.tints.secondary.bg
                              : theme.tints.error.bg,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            ...Typography.caption,
                            color: service.isActive
                              ? theme.tints.secondary.fg
                              : theme.tints.error.fg,
                          }}
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    {service.description ? (
                      <Text
                        style={[styles.meta, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {service.description}
                      </Text>
                    ) : null}
                    <Text style={[styles.meta, { color: theme.textMuted }]}>
                      {formatWaitTime(service.durationMinutes)} ·{' '}
                      {formatPrice(service.price)} · Order {service.displayOrder}
                    </Text>
                    <View style={styles.serviceActions}>
                      <Button
                        title={service.isActive ? 'Deactivate' : 'Activate'}
                        variant="ghost"
                        size="sm"
                        loading={
                          toggleService.isPending &&
                          toggleService.variables?.id === service.id
                        }
                        disabled={
                          (toggleService.isPending &&
                            toggleService.variables?.id === service.id) ||
                          (deleteService.isPending &&
                            deleteService.variables === service.id)
                        }
                        onPress={() => {
                          void toggleService.mutateAsync({
                            id: service.id,
                            activate: !service.isActive,
                          });
                        }}
                        fullWidth={false}
                      />
                      <Button
                        title="Delete"
                        variant="ghost"
                        size="sm"
                        loading={
                          deleteService.isPending &&
                          deleteService.variables === service.id
                        }
                        disabled={
                          (deleteService.isPending &&
                            deleteService.variables === service.id) ||
                          (toggleService.isPending &&
                            toggleService.variables?.id === service.id)
                        }
                        onPress={() => {
                          Alert.alert(
                            'Delete service?',
                            'This cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => {
                                  void deleteService
                                    .mutateAsync(service.id)
                                    .then(() => refetchServices());
                                },
                              },
                            ],
                          );
                        }}
                        fullWidth={false}
                      />
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
          <PrimaryButton
            title="Add service"
            leftIcon={<Plus size={16} color={Colors.textInverse} />}
            onPress={() => pushCreateService(department.id)}
          />
        </Animated.View>
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
    gap: Spacing.sm,
  },
  summary: {
    gap: Spacing.sm,
  },
  description: {
    ...Typography.body,
  },
  meta: {
    ...Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  stack: {
    gap: Spacing.sm,
  },
  serviceCard: {
    gap: Spacing.xs,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  serviceName: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  pill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
