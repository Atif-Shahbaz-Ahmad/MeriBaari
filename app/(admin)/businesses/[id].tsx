import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { LocationMapPreview } from '@/components/organization/LocationMapPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getSubscriptionErrorMessage } from '@/domain/errors/subscription-error';
import {
  useAdminBusiness,
  useSetAdminBusinessVisibility,
} from '@/features/subscription/hooks/use-subscription';
import { hasValidCoords } from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import type { OrganizationCategory } from '@/types/organization';

function paramId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function AdminBusinessScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(rawId);
  const query = useAdminBusiness(id);
  const visibility = useSetAdminBusinessVisibility();
  const [mode, setMode] = useState<'idle' | 'hide' | 'restore'>('idle');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const busy = visibility.isPending;

  if (query.isLoading) {
    return (
      <Screen>
        <FlowHeader title={t('admin.business.title')} onBack={() => router.back()} />
        <LoadingSkeleton count={4} variant="detail" />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <FlowHeader title={t('admin.business.title')} onBack={() => router.back()} />
        <ErrorState
          title={t('admin.business.loadError')}
          description={getSubscriptionErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const business = query.data;
  const categoryLabel = getOrganizationCategoryLabel(
    business.category as OrganizationCategory,
  );
  const hidden = business.adminHidden;

  const onConfirmHide = async () => {
    if (!id || busy) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setFormError(t('admin.business.reasonRequired'));
      return;
    }
    setFormError(null);
    try {
      await visibility.mutateAsync({
        organizationId: id,
        visible: false,
        reason: trimmed,
      });
      setMode('idle');
      setReason('');
    } catch (e) {
      setFormError(getSubscriptionErrorMessage(e));
    }
  };

  const onConfirmRestore = async () => {
    if (!id || busy) return;
    setFormError(null);
    try {
      await visibility.mutateAsync({ organizationId: id, visible: true });
      setMode('idle');
    } catch (e) {
      setFormError(getSubscriptionErrorMessage(e));
    }
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('admin.business.title')}
            subtitle={business.name}
            onBack={() => router.back()}
          />
        </View>

        <View style={styles.padded}>
          <Card style={styles.card}>
            <Text style={[styles.heading, { color: theme.text }]}>
              {t('admin.review.businessInfo')}
            </Text>
            <Text style={[styles.line, { color: theme.text }]}>{business.name}</Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.owner')}: {business.ownerName ?? '—'}
            </Text>
            {business.ownerEmail ? (
              <Text style={[styles.line, { color: theme.textSecondary }]}>
                {business.ownerEmail}
              </Text>
            ) : null}
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.category')}: {categoryLabel}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.phone')}: {business.phone ?? '—'}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.address')}: {business.address || '—'}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.city')}: {business.city || '—'}
            </Text>
            {business.workingHours ? (
              <Text style={[styles.line, { color: theme.textSecondary }]}>
                {t('admin.business.hours')}: {business.workingHours}
              </Text>
            ) : null}
            <Text style={[styles.line, { color: theme.textMuted }]}>
              {t('admin.business.liveSince')}: {formatWhen(business.approvedAt)}
            </Text>
            {hasValidCoords(business.latitude, business.longitude) ? (
              <LocationMapPreview
                latitude={business.latitude}
                longitude={business.longitude}
                label={business.name}
                address={business.address}
                city={business.city}
              />
            ) : null}
          </Card>
        </View>

        <View style={styles.padded}>
          <Card style={styles.card}>
            <Text style={[styles.heading, { color: theme.text }]}>
              {t('admin.business.visibilityTitle')}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.business.visibilityBody')}
            </Text>
            <Text
              style={[
                styles.line,
                { color: hidden ? Colors.error : theme.text },
              ]}
            >
              {hidden
                ? t('admin.business.hidden')
                : t('admin.business.visible')}
            </Text>
            {hidden && business.adminHiddenReason ? (
              <Text style={[styles.line, { color: theme.textSecondary }]}>
                {t('admin.business.hiddenReason')}: {business.adminHiddenReason}
              </Text>
            ) : null}

            {mode === 'idle' ? (
              <Button
                title={
                  hidden
                    ? t('admin.business.restore')
                    : t('admin.business.hide')
                }
                variant={hidden ? 'primary' : 'danger'}
                onPress={() => {
                  setFormError(null);
                  setMode(hidden ? 'restore' : 'hide');
                }}
                disabled={busy}
              />
            ) : null}

            {mode === 'hide' ? (
              <>
                <Text style={[styles.line, { color: theme.text }]}>
                  {t('admin.business.hideTitle')}
                </Text>
                <Text style={[styles.line, { color: theme.textSecondary }]}>
                  {t('admin.business.hideBody')}
                </Text>
                <Input
                  label={t('admin.business.reasonLabel')}
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t('admin.business.reasonPlaceholder')}
                  multiline
                />
                {formError ? (
                  <Text style={[styles.line, { color: Colors.error }]}>
                    {formError}
                  </Text>
                ) : null}
                <PrimaryButton
                  title={t('admin.business.confirmHide')}
                  onPress={() => void onConfirmHide()}
                  loading={busy}
                  disabled={busy}
                />
                <Button
                  title={t('common.cancel')}
                  variant="ghost"
                  onPress={() => {
                    setMode('idle');
                    setFormError(null);
                  }}
                  disabled={busy}
                />
              </>
            ) : null}

            {mode === 'restore' ? (
              <>
                <Text style={[styles.line, { color: theme.text }]}>
                  {t('admin.business.restoreTitle')}
                </Text>
                <Text style={[styles.line, { color: theme.textSecondary }]}>
                  {t('admin.business.restoreBody')}
                </Text>
                {formError ? (
                  <Text style={[styles.line, { color: Colors.error }]}>
                    {formError}
                  </Text>
                ) : null}
                <PrimaryButton
                  title={t('admin.business.confirmRestore')}
                  onPress={() => void onConfirmRestore()}
                  loading={busy}
                  disabled={busy}
                />
                <Button
                  title={t('common.cancel')}
                  variant="ghost"
                  onPress={() => {
                    setMode('idle');
                    setFormError(null);
                  }}
                  disabled={busy}
                />
              </>
            ) : null}
          </Card>
        </View>
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
  card: {
    gap: Spacing.sm,
  },
  heading: {
    ...Typography.h3,
  },
  line: {
    ...Typography.body,
  },
});
