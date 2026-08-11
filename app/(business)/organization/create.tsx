import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
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
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { ORGANIZATION_CATEGORY_OPTIONS } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { replaceBusinessHome } from '@/features/business/navigation';
import { useCreateOrganization } from '@/features/organization/hooks/use-organization-mutations';
import {
  organizationFormSchema,
  type OrganizationFormValues,
} from '@/features/organization/schemas';
import { useTheme } from '@/hooks/use-theme';

export default function CreateOrganizationScreen() {
  const theme = useTheme();
  const createOrganization = useCreateOrganization();
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (values: OrganizationFormValues) => {
    setError(null);
    try {
      await createOrganization.mutateAsync({
        name: values.name,
        category: values.category,
        description: values.description || '',
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || '',
        city: values.city || '',
        logoUrl: values.logoUrl || null,
      });
      replaceBusinessHome();
    } catch (e) {
      setError(getOrganizationErrorMessage(e));
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
              title="Create Organization"
              subtitle="Set up your business so customers can find you"
              onBack={() => router.back()}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.padded}>
            <Card style={styles.form}>
              <Controller
                control={form.control}
                name="name"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <Input
                    label="Organization Name"
                    placeholder="e.g. Downtown Barber Studio"
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
                  render={({ field: { onChange, value }, fieldState }) => (
                    <View style={styles.chips}>
                      {ORGANIZATION_CATEGORY_OPTIONS.map((item) => (
                        <CategoryChip
                          key={item.id}
                          label={item.label}
                          selected={value === item.id}
                          onPress={() => onChange(item.id)}
                        />
                      ))}
                      {fieldState.error?.message ? (
                        <Text style={styles.fieldError}>{fieldState.error.message}</Text>
                      ) : null}
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
                    placeholder="Tell customers what you offer"
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
                    placeholder="Business phone"
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
                    placeholder="business@example.com"
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
                    placeholder="Street address"
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
                    placeholder="City"
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
                    placeholder="Optional public image URL"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={fieldState.error?.message}
                    autoCapitalize="none"
                    hint="Logo upload will use Supabase Storage later. You can skip this for now."
                  />
                )}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.padded}>
            <PrimaryButton
              title="Create Organization"
              onPress={() => void form.handleSubmit(onSubmit)()}
              loading={createOrganization.isPending}
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
  fieldError: {
    ...Typography.caption,
    color: Colors.error,
    width: '100%',
  },
});
