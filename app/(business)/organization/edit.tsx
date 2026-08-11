import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ORGANIZATION_CATEGORY_OPTIONS } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import {
  pushCreateOrganization,
  replaceBusinessHome,
} from '@/features/business/navigation';
import {
  useActivateOrganization,
  useDeactivateOrganization,
  useUpdateOrganization,
} from '@/features/organization/hooks/use-organization-mutations';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import {
  organizationFormSchema,
  type OrganizationFormValues,
} from '@/features/organization/schemas';
import { useTheme } from '@/hooks/use-theme';

export default function EditOrganizationScreen() {
  const theme = useTheme();
  const { data: organization, isLoading, isError, refetch, error } =
    useMyOrganization();
  const updateOrganization = useUpdateOrganization();
  const deactivateOrganization = useDeactivateOrganization();
  const activateOrganization = useActivateOrganization();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      category: 'other',
      description: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (!organization) return;
    form.reset({
      name: organization.name,
      category: organization.category,
      description: organization.description,
      phone: organization.phone ?? '',
      email: organization.email ?? '',
      address: organization.address,
      city: organization.city,
      logoUrl: organization.logoUrl ?? '',
    });
  }, [organization, form]);

  const onSubmit = async (values: OrganizationFormValues) => {
    if (!organization) return;
    setFormError(null);
    try {
      await updateOrganization.mutateAsync({
        id: organization.id,
        data: {
          name: values.name,
          category: values.category,
          description: values.description || '',
          phone: values.phone || null,
          email: values.email || null,
          address: values.address || '',
          city: values.city || '',
          logoUrl: values.logoUrl || null,
        },
      });
      Alert.alert('Organization updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setFormError(getOrganizationErrorMessage(e));
    }
  };

  const onToggleActive = () => {
    if (!organization) return;
    const nextActive = !organization.isActive;
    Alert.alert(
      nextActive ? 'Activate organization?' : 'Deactivate organization?',
      nextActive
        ? 'Customers will be able to discover your organization again.'
        : 'Customers will no longer see your organization in discovery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Activate' : 'Deactivate',
          style: nextActive ? 'default' : 'destructive',
          onPress: () => {
            void (async () => {
              try {
                if (nextActive) {
                  await activateOrganization.mutateAsync(organization.id);
                } else {
                  await deactivateOrganization.mutateAsync(organization.id);
                }
              } catch (e) {
                setFormError(getOrganizationErrorMessage(e));
              }
            })();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <FlowHeader title="Edit Organization" onBack={() => router.back()} />
        <LoadingSkeleton count={3} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title="Edit Organization" onBack={() => router.back()} />
        <ErrorState
          title="Could not load organization"
          description={getOrganizationErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen>
        <FlowHeader title="Edit Organization" onBack={() => router.back()} />
        <EmptyState
          title="No organization yet"
          description="Create your organization to start managing queues."
          actionLabel="Create Organization"
          onActionPress={pushCreateOrganization}
        />
      </Screen>
    );
  }

  const pending =
    updateOrganization.isPending ||
    deactivateOrganization.isPending ||
    activateOrganization.isPending;

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
              title="Edit Organization"
              subtitle={
                organization.isActive
                  ? 'Visible to customers'
                  : 'Hidden from customer discovery'
              }
              onBack={() => router.back()}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.padded}>
            <Card style={styles.statusCard}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                Status
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: organization.isActive ? Colors.secondary600 : Colors.error },
                ]}
              >
                {organization.isActive ? 'Active' : 'Inactive'}
              </Text>
              <Button
                title={organization.isActive ? 'Deactivate' : 'Activate'}
                variant={organization.isActive ? 'outline' : 'primary'}
                onPress={onToggleActive}
                loading={
                  deactivateOrganization.isPending || activateOrganization.isPending
                }
                disabled={pending}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.padded}>
            <Card style={styles.form}>
              <Controller
                control={form.control}
                name="name"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Organization Name"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    autoCapitalize="words"
                  />
                )}
              />

              <View style={styles.categoryBlock}>
                <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.chips}>
                      {ORGANIZATION_CATEGORY_OPTIONS.map((item) => (
                        <CategoryChip
                          key={item.id}
                          label={item.label}
                          selected={value === item.id}
                          onPress={() => onChange(item.id)}
                        />
                      ))}
                    </View>
                  )}
                />
              </View>

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
                name="phone"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Phone"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    keyboardType="phone-pad"
                  />
                )}
              />

              <Controller
                control={form.control}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Email"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />

              <Controller
                control={form.control}
                name="address"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Address"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="city"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="City"
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
                name="logoUrl"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Logo URL"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    autoCapitalize="none"
                    hint="Optional. Storage upload will be added later."
                  />
                )}
              />

              {formError ? <Text style={styles.error}>{formError}</Text> : null}
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.padded}>
            <PrimaryButton
              title="Save changes"
              onPress={() => void form.handleSubmit(onSubmit)()}
              loading={updateOrganization.isPending}
            />
            <Button
              title="Back to dashboard"
              variant="ghost"
              onPress={replaceBusinessHome}
              disabled={pending}
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
    gap: Spacing.sm,
  },
  form: {
    gap: Spacing.md,
  },
  statusCard: {
    gap: Spacing.sm,
  },
  statusLabel: {
    ...Typography.caption,
  },
  statusValue: {
    ...Typography.h3,
  },
  categoryBlock: {
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
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
