import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { DEPARTMENT_ICON_IDS } from '@/domain/models/department';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import {
  pushCreateOrganization,
} from '@/features/business/navigation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useCreateDepartment } from '@/features/structure/hooks/use-structure-mutations';
import {
  departmentFormSchema,
  type DepartmentFormValues,
} from '@/features/structure/schemas';
import { DEPARTMENT_ICON_LABELS } from '@/lib/department-icons';
import { useTheme } from '@/hooks/use-theme';

export default function CreateDepartmentScreen() {
  const theme = useTheme();
  const { data: organization, isLoading } = useMyOrganization();
  const createDepartment = useCreateDepartment();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'users',
      isActive: true,
      displayOrder: '0',
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <FlowHeader title="Add Department" onBack={() => router.back()} />
        <LoadingSkeleton count={2} variant="detail" />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen>
        <FlowHeader title="Add Department" onBack={() => router.back()} />
        <EmptyState
          title="Organization required"
          description="Create your organization before adding departments."
          actionLabel="Create Organization"
          onActionPress={pushCreateOrganization}
        />
      </Screen>
    );
  }

  const onSubmit = async (values: DepartmentFormValues) => {
    setError(null);
    try {
      const department = await createDepartment.mutateAsync({
        organizationId: organization.id,
        name: values.name,
        description: values.description || '',
        icon: values.icon,
        isActive: values.isActive,
        displayOrder: Number(values.displayOrder),
      });
      router.replace(`/(business)/department/${department.id}` as never);
    } catch (e) {
      setError(getStructureErrorMessage(e));
    }
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
            <FlowHeader
              title="Add Department"
              subtitle={organization.name}
              onBack={() => router.back()}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(400)}
            style={styles.padded}
          >
            <Card style={styles.form}>
              <Controller
                control={form.control}
                name="name"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Department Name"
                    placeholder="e.g. General Medicine"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    autoCapitalize="words"
                  />
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Description"
                    placeholder="What this department covers"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    multiline
                    style={styles.multiline}
                  />
                )}
              />

              <View style={styles.block}>
                <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
                <Controller
                  control={form.control}
                  name="icon"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.chips}>
                      {DEPARTMENT_ICON_IDS.map((icon) => (
                        <CategoryChip
                          key={icon}
                          label={DEPARTMENT_ICON_LABELS[icon]}
                          selected={value === icon}
                          onPress={() => onChange(icon)}
                        />
                      ))}
                    </View>
                  )}
                />
              </View>

              <Controller
                control={form.control}
                name="displayOrder"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Display Order"
                    placeholder="0"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    keyboardType="number-pad"
                  />
                )}
              />

              <Controller
                control={form.control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.switchRow}>
                    <View style={styles.switchCopy}>
                      <Text style={[styles.label, { color: theme.text }]}>
                        Active
                      </Text>
                      <Text style={[styles.hint, { color: theme.textMuted }]}>
                        Inactive departments are hidden from customers
                      </Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ true: Colors.primary, false: theme.border }}
                    />
                  </View>
                )}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Card>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(140).duration(400)}
            style={styles.padded}
          >
            <PrimaryButton
              title="Create Department"
              onPress={() => void form.handleSubmit(onSubmit)()}
              loading={createDepartment.isPending}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  form: {
    gap: Spacing.md,
  },
  block: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.small,
  },
  hint: {
    ...Typography.caption,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
