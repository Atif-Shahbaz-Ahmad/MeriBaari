import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { LocationMapPreview } from '@/components/organization/LocationMapPreview';
import { OrganizationLogoEditor } from '@/components/organization/OrganizationLogoEditor';
import { UseCurrentLocationControl } from '@/components/organization/UseCurrentLocationControl';
import { Card } from '@/components/ui/Card';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import {
  ORGANIZATION_CATEGORY_OPTIONS,
  organizationCategoryLabelKey,
} from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { replaceSubscriptionWelcome } from '@/features/subscription/navigation';
import { formatCoordinateForForm } from '@/features/organization/hooks/use-capture-organization-location';
import {
  useCreateOrganization,
  useUploadOrganizationLogo,
} from '@/features/organization/hooks/use-organization-mutations';
import {
  organizationFormSchema,
  parseOptionalCoordinate,
  type OrganizationFormValues,
} from '@/features/organization/schemas';
import { hasValidCoords } from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function CreateOrganizationScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const createOrganization = useCreateOrganization();
  const uploadLogo = useUploadOrganizationLogo();
  const [error, setError] = useState<string | null>(null);
  const [pendingLogoUri, setPendingLogoUri] = useState<string | null>(null);

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
      latitude: '',
      longitude: '',
      logoUrl: '',
    },
  });

  const watchedLatitude = form.watch('latitude');
  const watchedLongitude = form.watch('longitude');
  const watchedName = form.watch('name');
  const watchedAddress = form.watch('address');
  const watchedCity = form.watch('city');
  const previewLatitude = parseOptionalCoordinate(watchedLatitude);
  const previewLongitude = parseOptionalCoordinate(watchedLongitude);

  const onSubmit = async (values: OrganizationFormValues) => {
    setError(null);
    try {
      const org = await createOrganization.mutateAsync({
        name: values.name,
        category: values.category,
        description: values.description || '',
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || '',
        city: values.city || '',
        latitude: parseOptionalCoordinate(values.latitude),
        longitude: parseOptionalCoordinate(values.longitude),
        logoUrl: null,
      });

      if (pendingLogoUri) {
        try {
          await uploadLogo.mutateAsync({
            organizationId: org.id,
            localUri: pendingLogoUri,
          });
        } catch (logoError) {
          Alert.alert(
            'Organization created',
            `${getOrganizationErrorMessage(logoError)} You can add a logo later from Edit Organization.`,
          );
          replaceSubscriptionWelcome();
          return;
        }
      }

      replaceSubscriptionWelcome();
    } catch (e) {
      setError(getOrganizationErrorMessage(e));
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
                          label={t(organizationCategoryLabelKey(item.id))}
                          selected={value === item.id}
                          onPress={() => onChange(item.id)}
                        />
                      ))}
                      {fieldState.error?.message ? (
                        <Text style={styles.fieldError}>
                          {t(fieldState.error.message)}
                        </Text>
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

              <UseCurrentLocationControl
                disabled={createOrganization.isPending}
                onCoords={(coords) => {
                  form.setValue('latitude', formatCoordinateForForm(coords.latitude), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue(
                    'longitude',
                    formatCoordinateForForm(coords.longitude),
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  );
                }}
              />

              {hasValidCoords(previewLatitude, previewLongitude) ? (
                <LocationMapPreview
                  latitude={previewLatitude}
                  longitude={previewLongitude}
                  label={watchedName}
                  address={watchedAddress}
                  city={watchedCity}
                />
              ) : (
                <Text style={[styles.locationHint, { color: theme.textMuted }]}>
                  No map location yet. Use Current Location so customers can find you.
                </Text>
              )}

              {(form.formState.errors.latitude?.message ||
                form.formState.errors.longitude?.message) && (
                <Text style={styles.error}>
                  {t(
                    form.formState.errors.latitude?.message ||
                      form.formState.errors.longitude?.message ||
                      '',
                  )}
                </Text>
              )}

              <OrganizationLogoEditor
                name={watchedName || 'Business'}
                logoUrl={pendingLogoUri}
                previewOnly
                loading={createOrganization.isPending || uploadLogo.isPending}
                onPick={async (localUri) => {
                  setPendingLogoUri(localUri);
                }}
                onRemove={async () => {
                  setPendingLogoUri(null);
                }}
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
  locationHint: {
    ...Typography.caption,
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
