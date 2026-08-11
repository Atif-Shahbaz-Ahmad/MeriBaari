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
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getStructureErrorMessage } from '@/domain/errors/structure-error';
import { useUpdateService } from '@/features/structure/hooks/use-structure-mutations';
import { useService } from '@/features/structure/hooks/use-structure-queries';
import {
  serviceFormSchema,
  type ServiceFormValues,
} from '@/features/structure/schemas';
import { useTheme } from '@/hooks/use-theme';

export default function EditServiceScreen() {
  const theme = useTheme();
  const { serviceId } = useLocalSearchParams<{
    departmentId: string;
    serviceId: string;
  }>();
  const { data: service, isLoading, isError, error, refetch } =
    useService(serviceId);
  const updateService = useUpdateService();
  const [formError, setFormError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!service) return;
    form.reset({
      name: service.name,
      description: service.description,
      durationMinutes: String(service.durationMinutes),
      price: service.price === null ? '' : String(service.price),
      isActive: service.isActive,
      displayOrder: String(service.displayOrder),
    });
  }, [service, form]);

  if (isLoading) {
    return (
      <Screen>
        <FlowHeader title="Edit Service" onBack={() => router.back()} />
        <LoadingSkeleton count={2} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title="Edit Service" onBack={() => router.back()} />
        <ErrorState
          description={getStructureErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!service) {
    return (
      <Screen>
        <FlowHeader title="Edit Service" onBack={() => router.back()} />
        <EmptyState title="Service not found" />
      </Screen>
    );
  }

  const onSubmit = async (values: ServiceFormValues) => {
    setFormError(null);
    try {
      const priceValue =
        !values.price || values.price.trim() === ''
          ? null
          : Number(values.price);
      await updateService.mutateAsync({
        id: service.id,
        data: {
          name: values.name,
          description: values.description || '',
          durationMinutes: Number(values.durationMinutes),
          price: priceValue,
          isActive: values.isActive,
          displayOrder: Number(values.displayOrder),
        },
      });
      Alert.alert('Service updated', 'Your changes have been saved.', [
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
            <FlowHeader
              title="Edit Service"
              subtitle={service.name}
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
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    keyboardType="decimal-pad"
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
              loading={updateService.isPending}
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
