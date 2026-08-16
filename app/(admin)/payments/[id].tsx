import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { formatSubscriptionPrice } from '@/config/payment';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getSubscriptionErrorMessage } from '@/domain/errors/subscription-error';
import { replaceAdminHome } from '@/features/admin/navigation';
import {
  useAdminPayment,
  useReviewSubscriptionPayment,
} from '@/features/subscription/hooks/use-subscription';
import { hasValidCoords } from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import type { OrganizationCategory } from '@/types/organization';

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function paramId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function AdminPaymentReviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(rawId);
  const paymentQuery = useAdminPayment(id);
  const review = useReviewSubscriptionPayment();
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const busy = review.isPending;

  const onConfirmApprove = async () => {
    if (!id || busy) return;
    setFormError(null);
    try {
      await review.mutateAsync({ paymentId: id, action: 'approve' });
      replaceAdminHome();
    } catch (e) {
      setFormError(getSubscriptionErrorMessage(e));
    }
  };

  const onConfirmReject = async () => {
    if (!id || busy) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setFormError(t('admin.review.reasonRequired'));
      return;
    }
    setFormError(null);
    try {
      await review.mutateAsync({
        paymentId: id,
        action: 'reject',
        reason: trimmed,
      });
      replaceAdminHome();
    } catch (e) {
      setFormError(getSubscriptionErrorMessage(e));
    }
  };

  if (paymentQuery.isLoading) {
    return (
      <Screen>
        <FlowHeader title={t('admin.review.title')} onBack={() => router.back()} />
        <LoadingSkeleton count={5} variant="detail" />
      </Screen>
    );
  }

  if (paymentQuery.isError || !paymentQuery.data) {
    return (
      <Screen>
        <FlowHeader title={t('admin.review.title')} onBack={() => router.back()} />
        <ErrorState
          title={t('admin.review.loadError')}
          description={getSubscriptionErrorMessage(paymentQuery.error)}
          onRetry={() => void paymentQuery.refetch()}
        />
      </Screen>
    );
  }

  const payment = paymentQuery.data;
  const categoryLabel = getOrganizationCategoryLabel(
    payment.organizationCategory as OrganizationCategory,
  );
  const pending = payment.status === 'pending';

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('admin.review.title')}
            subtitle={payment.organizationName}
            onBack={() => router.back()}
          />
        </View>

        <View style={styles.padded}>
          <Card style={styles.card}>
            <Text style={[styles.heading, { color: theme.text }]}>
              {t('admin.review.businessInfo')}
            </Text>
            <Text style={[styles.line, { color: theme.text }]}>
              {t('admin.review.businessName')}: {payment.organizationName}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.owner')}: {payment.ownerName ?? '—'}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.category')}: {categoryLabel}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.phone')}: {payment.organizationPhone ?? '—'}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.address')}: {payment.organizationAddress || '—'}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.city')}: {payment.organizationCity || '—'}
            </Text>
            {hasValidCoords(payment.organizationLatitude, payment.organizationLongitude) ? (
              <LocationMapPreview
                latitude={payment.organizationLatitude}
                longitude={payment.organizationLongitude}
                label={payment.organizationName}
                address={payment.organizationAddress}
                city={payment.organizationCity}
              />
            ) : null}
          </Card>
        </View>

        <View style={styles.padded}>
          <Card style={styles.card}>
            <Text style={[styles.heading, { color: theme.text }]}>
              {t('admin.review.paymentInfo')}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.amount')}: {formatSubscriptionPrice(payment.amount)}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('subscription.payment.methodLabel')}:{' '}
              {payment.paymentMethod === 'easypaisa'
                ? t('subscription.payment.methodEasypaisa')
                : t('subscription.payment.methodBank')}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.submitted')}: {formatWhen(payment.submittedAt)}
            </Text>
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {t('admin.review.status')}: {t(`admin.status.${payment.status}`)}
            </Text>
            {payment.proofSignedUrl ? (
              <Image
                source={{ uri: payment.proofSignedUrl }}
                style={styles.proof}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.line, { color: Colors.error }]}>
                {t('admin.review.proofMissing')}
              </Text>
            )}
          </Card>
        </View>

        {pending ? (
          <View style={styles.padded}>
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            {mode === 'approve' ? (
              <>
                <Text style={[styles.confirm, { color: theme.textSecondary }]}>
                  {t('admin.review.approveBody')}
                </Text>
                <PrimaryButton
                  title={t('admin.review.confirmApprove')}
                  onPress={() => void onConfirmApprove()}
                  loading={busy}
                  disabled={busy}
                />
                <Button
                  title={t('common.cancel')}
                  variant="ghost"
                  disabled={busy}
                  onPress={() => setMode('idle')}
                />
              </>
            ) : mode === 'reject' ? (
              <>
                <Input
                  label={t('admin.review.reasonLabel')}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  placeholder={t('admin.review.reasonPlaceholder')}
                />
                <Button
                  title={t('admin.review.confirmReject')}
                  variant="danger"
                  loading={busy}
                  disabled={busy}
                  onPress={() => void onConfirmReject()}
                />
                <Button
                  title={t('common.cancel')}
                  variant="ghost"
                  disabled={busy}
                  onPress={() => setMode('idle')}
                />
              </>
            ) : (
              <>
                <PrimaryButton
                  title={t('admin.review.approve')}
                  onPress={() => {
                    setFormError(null);
                    setMode('approve');
                  }}
                  disabled={busy}
                />
                <Button
                  title={t('admin.review.reject')}
                  variant="danger"
                  disabled={busy}
                  onPress={() => {
                    setFormError(null);
                    setMode('reject');
                  }}
                />
              </>
            )}
          </View>
        ) : null}
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
  confirm: {
    ...Typography.body,
  },
  proof: {
    width: '100%',
    height: 280,
    borderRadius: Radius.lg,
    backgroundColor: Colors.borderLight,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
