import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
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
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { DEPARTMENT_ICON_IDS } from '@/domain/models/department';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import { useUpdateDepartment } from '@/features/structure/hooks/use-structure-mutations';
import { useDepartment } from '@/features/structure/hooks/use-structure-queries';
import {
  departmentFormSchema,
  type DepartmentFormValues,
} from '@/features/structure/schemas';
import { DEPARTMENT_ICON_LABELS } from '@/lib/department-icons';
import { useTheme } from '@/hooks/use-theme';

export default function EditDepartmentScreen() {
  const theme = useTheme();
  const { departmentId } = useLocalSearchParams<{ departmentId: string }>();
  const { data: department, isLoading, isError, error, refetch } =
    useDepartment(departmentId);
  const updateDepartment = useUpdateDepartment();
  const [formError, setFormError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!department) return;
    form.reset({
      name: department.name,
      description: department.description,
      icon: department.icon,
      isActive: department.isActive,
      displayOrder: String(department.displayOrder),
    });
  }, [department, form]);

  if (isLoading) {
    return (
      <Screen>
        <FlowHeader title="Edit Department" onBack={() => router.back()} />
        <LoadingSkeleton count={2} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title="Edit Department" onBack={() => router.back()} />
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
        <FlowHeader title="Edit Department" onBack={() => router.back()} />
        <EmptyState
          title="Department not found"
          description="This department may have been removed or is no longer available."
        />
      </Screen>
    );
  }

  const onSubmit = async (values: DepartmentFormValues) => {
    setFormError(null);
    try {
      await updateDepartment.mutateAsync({
        id: department.id,
        data: {
          name: values.name,
          description: values.description || '',
          icon: values.icon,
          isActive: values.isActive,
          displayOrder: Number(values.displayOrder),
        },
      });
      Alert.alert('Department updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setFormError(getStructureErrorMessage(e));
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
              title="Edit Department"
              subtitle={department.name}
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
                    <Text style={[styles.label, { color: theme.text, flex: 1 }]}>
                      Active
                    </Text>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ true: Colors.primary, false: theme.border }}
                    />
                  </View>
                )}
              />
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
            </Card>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(140).duration(400)}
            style={styles.padded}
          >
            <PrimaryButton
              title="Save changes"
              onPress={() => void form.handleSubmit(onSubmit)()}
              loading={updateDepartment.isPending}
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
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
