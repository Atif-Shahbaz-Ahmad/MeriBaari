import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
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
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import { useCreateService } from '@/features/structure/hooks/use-structure-mutations';
import { useDepartment } from '@/features/structure/hooks/use-structure-queries';
import {
  serviceFormSchema,
  type ServiceFormValues,
} from '@/features/structure/schemas';
import { useTheme } from '@/hooks/use-theme';

export default function CreateServiceScreen() {
  const theme = useTheme();
  const { departmentId } = useLocalSearchParams<{ departmentId: string }>();
  const { data: department, isLoading } = useDepartment(departmentId);
  const createService = useCreateService();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      durationMinutes: '15',
      price: '',
      isActive: true,
      displayOrder: '0',
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <FlowHeader title="Add Service" onBack={() => router.back()} />
        <LoadingSkeleton count={2} variant="detail" />
      </Screen>
    );
  }

  if (!department) {
    return (
      <Screen>
        <FlowHeader title="Add Service" onBack={() => router.back()} />
        <EmptyState
          title="Department not found"
          description="This department may have been removed or is no longer available."
        />
      </Screen>
    );
  }

  const onSubmit = async (values: ServiceFormValues) => {
    setError(null);
    try {
      const priceValue =
        !values.price || values.price.trim() === ''
          ? null
          : Number(values.price);
      await createService.mutateAsync({
        departmentId: department.id,
        organizationId: department.organizationId,
        name: values.name,
        description: values.description || '',
        durationMinutes: Number(values.durationMinutes),
        price: priceValue,
        isActive: values.isActive,
        displayOrder: Number(values.displayOrder),
      });
      router.back();
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
              title="Add Service"
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
                    label="Service Name"
                    placeholder="e.g. Doctor Consultation"
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
              <Controller
                control={form.control}
                name="durationMinutes"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Duration (minutes)"
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
                name="price"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Price (optional)"
                    placeholder="Leave blank to hide pricing"
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    keyboardType="decimal-pad"
                    hint="Some businesses prefer not to show prices"
                  />
                )}
              />
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
                    <View style={styles.switchCopy}>
                      <Text style={[styles.label, { color: theme.text }]}>
                        Active
                      </Text>
                      <Text style={[styles.hint, { color: theme.textMuted }]}>
                        Inactive services cannot be selected by customers
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
              title="Create Service"
              onPress={() => void form.handleSubmit(onSubmit)()}
              loading={createService.isPending}
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
  label: {
    ...Typography.small,
  },
  hint: {
    ...Typography.caption,
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
