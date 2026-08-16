import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { PaymentInstructions } from '@/components/subscription/PaymentInstructions';
import { PaymentProofPicker } from '@/components/subscription/PaymentProofPicker';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PAYMENT_CONFIG } from '@/config/payment';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getOrganizationErrorMessage } from '@/domain/errors/organization-error';
import { getSubscriptionErrorMessage } from '@/domain/errors/subscription-error';
import { isOrganizationPublic } from '@/domain/models';
import {
  isSubscriptionPaymentOnCooldown,
  lastSubscriptionApprovalAt,
  nextSubscriptionPaymentAt,
  type SubscriptionPaymentMethod,
} from '@/domain/models/subscription';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import {
  useMyLatestPayment,
  useSubmitSubscriptionPayment,
} from '@/features/subscription/hooks/use-subscription';
import { replaceSubscriptionSubmitted } from '@/features/subscription/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function SubscriptionPaymentScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: organization, isLoading, isError, error, refetch } =
    useMyOrganization();
  const latest = useMyLatestPayment(organization?.id);
  const submit = useSubmitSubscriptionPayment();
  const [method, setMethod] = useState<SubscriptionPaymentMethod>('bank_transfer');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const submitting = submit.isPending;
  const alreadyPending =
    organization?.subscriptionStatus === 'pending_approval' ||
    latest.data?.status === 'pending';
  const lastApprovedAt = lastSubscriptionApprovalAt(
    latest.data,
    organization?.approvedAt,
  );
  const onCooldown = isSubscriptionPaymentOnCooldown(
    lastApprovedAt,
    PAYMENT_CONFIG.renewalCooldownDays,
  );
  const nextPayAt = nextSubscriptionPaymentAt(
    lastApprovedAt,
    PAYMENT_CONFIG.renewalCooldownDays,
  );
  const visibleToCustomers = organization
    ? isOrganizationPublic(organization)
    : false;
  const blocked = alreadyPending || onCooldown;

  const onSubmit = async () => {
    if (!organization || submitting) return;
    if (!proofUri) {
      setFormError(t('subscription.errors.proofRequired'));
      return;
    }
    setFormError(null);
    try {
      await submit.mutateAsync({
        organizationId: organization.id,
        paymentMethod: method,
        localProofUri: proofUri,
        amount: PAYMENT_CONFIG.monthlySubscriptionPrice,
        currency: PAYMENT_CONFIG.currency,
      });
      replaceSubscriptionSubmitted();
    } catch (e) {
      setFormError(getSubscriptionErrorMessage(e));
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <FlowHeader title={t('subscription.payment.title')} onBack={() => router.back()} />
        <LoadingSkeleton count={4} variant="detail" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title={t('subscription.payment.title')} onBack={() => router.back()} />
        <ErrorState
          title={t('subscription.errors.loadOrg')}
          description={getOrganizationErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen>
        <FlowHeader title={t('subscription.payment.title')} onBack={() => router.back()} />
        <ErrorState
          title={t('subscription.errors.noOrg')}
          description={t('subscription.errors.noOrgHint')}
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.padded}>
          <FlowHeader
            title={t('subscription.payment.title')}
            subtitle={t('subscription.payment.subtitle')}
            onBack={() => router.back()}
          />
        </View>

        <View style={styles.padded}>
          <Text style={[styles.intro, { color: theme.textSecondary }]}>
            {t('subscription.payment.intro')}
          </Text>
        </View>

        <View style={styles.padded}>
          <PaymentInstructions
            onCopied={() =>
              Alert.alert(t('subscription.payment.copiedTitle'), t('subscription.payment.copiedBody'))
            }
          />
        </View>

        <View style={styles.padded}>
          <Card>
            <Text style={[styles.section, { color: theme.text }]}>
              {t('subscription.status.policyTitle')}
            </Text>
            <Text style={[styles.intro, { color: theme.textSecondary }]}>
              {t('subscription.status.policyCooldown')}
            </Text>
            <Text style={[styles.intro, { color: theme.textSecondary }]}>
              {t('subscription.status.policyVisibility')}
            </Text>
          </Card>
        </View>

        {organization.adminHidden ? (
          <View style={styles.padded}>
            <Card>
              <Text style={[styles.section, { color: theme.text }]}>
                {t('subscription.status.adminHiddenTitle')}
              </Text>
              <Text style={[styles.intro, { color: theme.textSecondary }]}>
                {t('subscription.status.adminHiddenBody')}
              </Text>
              {organization.adminHiddenReason ? (
                <Text style={[styles.intro, { color: theme.text }]}>
                  {t('subscription.status.reasonLabel')}:{' '}
                  {organization.adminHiddenReason}
                </Text>
              ) : null}
            </Card>
          </View>
        ) : null}

        {alreadyPending || onCooldown ? (
          <View style={styles.padded}>
            <Card>
              <Text style={[styles.intro, { color: theme.textSecondary }]}>
                {alreadyPending
                  ? t('subscription.status.pendingBody')
                  : t('subscription.status.cooldownBody', {
                      date: nextPayAt ? nextPayAt.toLocaleDateString() : '—',
                    })}
              </Text>
              {!organization.adminHidden &&
              organization.subscriptionStatus === 'active' &&
              visibleToCustomers ? (
                <Text style={[styles.intro, { color: theme.textSecondary }]}>
                  {t('subscription.status.activeBody')}
                </Text>
              ) : null}
            </Card>
          </View>
        ) : null}

        {blocked ? null : (
          <>
            <View style={styles.padded}>
              <Text style={[styles.section, { color: theme.text }]}>
                {t('subscription.payment.methodLabel')}
              </Text>
              <View style={styles.methods}>
                {(['bank_transfer', 'easypaisa'] as const).map((value) => {
                  const selected = method === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setMethod(value)}
                      disabled={submitting}
                      style={[
                        styles.method,
                        {
                          borderColor: selected ? Colors.primary : theme.border,
                          backgroundColor: theme.card,
                        },
                      ]}
                    >
                      <Text style={[styles.methodLabel, { color: theme.text }]}>
                        {value === 'bank_transfer'
                          ? t('subscription.payment.methodBank')
                          : t('subscription.payment.methodEasypaisa')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.padded}>
              <PaymentProofPicker
                uri={proofUri}
                loading={submitting}
                error={formError && !proofUri ? formError : null}
                onChange={(uri) => {
                  setProofUri(uri);
                  setFormError(null);
                }}
              />
            </View>

            <View style={styles.padded}>
              {formError && proofUri ? (
                <Text style={styles.error}>{formError}</Text>
              ) : null}
              <PrimaryButton
                title={t('subscription.payment.submit')}
                onPress={() => void onSubmit()}
                loading={submitting}
                disabled={submitting}
              />
            </View>
          </>
        )}
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
  intro: {
    ...Typography.body,
  },
  section: {
    ...Typography.bodyMedium,
  },
  methods: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  method: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  methodLabel: {
    ...Typography.bodyMedium,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
