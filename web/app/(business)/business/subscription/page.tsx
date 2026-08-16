'use client';

import { useState } from 'react';
import Link from 'next/link';

import { formatSubscriptionPrice, PAYMENT_CONFIG } from '@/config/payment';
import { getSubscriptionErrorMessage } from '@/domain/errors/subscription-error';
import { isOrganizationPublic } from '@/domain/models';
import {
  isSubscriptionPaymentOnCooldown,
  lastSubscriptionApprovalAt,
  nextSubscriptionPaymentAt,
} from '@/domain/models/subscription';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import {
  useMyLatestPayment,
  useSubmitSubscriptionPayment,
} from '@/features/subscription/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import { Button, Card, EmptyState, LoadingSkeleton } from '@web/components/ui';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const org = useMyOrganization();
  const payment = useMyLatestPayment(org.data?.id);
  const submit = useSubmitSubscriptionPayment();
  const [method, setMethod] = useState<'bank_transfer' | 'easypaisa'>('bank_transfer');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (org.isLoading) return <LoadingSkeleton />;
  if (!org.data) return <EmptyState title={t('subscription.errors.noOrg')} />;

  const organization = org.data;
  const visible = isOrganizationPublic(organization);
  const pending =
    organization.subscriptionStatus === 'pending_approval' ||
    payment.data?.status === 'pending';
  const lastApprovedAt = lastSubscriptionApprovalAt(
    payment.data,
    organization.approvedAt,
  );
  const onCooldown = isSubscriptionPaymentOnCooldown(
    lastApprovedAt,
    PAYMENT_CONFIG.renewalCooldownDays,
  );
  const nextPayAt = nextSubscriptionPaymentAt(
    lastApprovedAt,
    PAYMENT_CONFIG.renewalCooldownDays,
  );
  const blocked = pending || onCooldown;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('subscription.payment.title')}</h1>
      <Card
        className={
          organization.adminHidden
            ? 'border-red-300 bg-red-50 dark:bg-[#450A0A]'
            : visible
              ? 'border-emerald-400 bg-emerald-50 dark:bg-[#14532D]'
              : 'border-amber-300 bg-amber-50 dark:bg-[#422006]'
        }
      >
        <p className="font-semibold text-ink">
          {organization.adminHidden
            ? t('subscription.status.adminHiddenTitle')
            : visible
              ? t('subscription.status.activeTitle')
              : pending
                ? t('subscription.status.pendingTitle')
                : t('subscription.status.activeHiddenTitle')}
        </p>
        <p className="mt-1 text-sm text-ink">
          {organization.adminHidden
            ? t('subscription.status.adminHiddenBody')
            : visible
              ? t('subscription.status.activeBody')
              : pending
                ? t('subscription.status.pendingBody')
                : t('subscription.payment.intro')}
        </p>
        {organization.adminHidden && organization.adminHiddenReason ? (
          <p className="mt-2 text-sm text-ink">
            {t('subscription.status.reasonLabel')}: {organization.adminHiddenReason}
          </p>
        ) : null}
        {onCooldown && nextPayAt ? (
          <p className="mt-2 text-sm text-ink-secondary">
            {t('subscription.status.cooldownBody', {
              date: nextPayAt.toLocaleDateString(),
            })}
          </p>
        ) : null}
        {payment.data ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Latest payment: {payment.data.status}
          </p>
        ) : null}
      </Card>

      <Card className="space-y-2 text-sm">
        <p className="font-semibold">{t('subscription.status.policyTitle')}</p>
        <p>{t('subscription.status.policyCooldown')}</p>
        <p>{t('subscription.status.policyVisibility')}</p>
        <p>
          <Link className="font-semibold text-primary" href="/privacy">
            {t('profile.privacyBusinessTitle')}
          </Link>
        </p>
      </Card>

      <Card className="space-y-2 text-sm">
        <p className="font-semibold">
          {t('subscription.payment.amountLabel')} {formatSubscriptionPrice()}
        </p>
        <p>
          {PAYMENT_CONFIG.bank.name}: {PAYMENT_CONFIG.bank.accountTitle} ·{' '}
          {PAYMENT_CONFIG.bank.accountNumber}
        </p>
        <p>IBAN {PAYMENT_CONFIG.bank.iban}</p>
        <p>
          Easypaisa: {PAYMENT_CONFIG.easypaisa.accountTitle} ·{' '}
          {PAYMENT_CONFIG.easypaisa.number}
        </p>
      </Card>

      {blocked ? null : (
        <Card className="space-y-3">
          <select
            className="w-full rounded-xl border border-line bg-surface-input px-3 py-2"
            value={method}
            onChange={(e) =>
              setMethod(e.target.value as 'bank_transfer' | 'easypaisa')
            }
          >
            <option value="bank_transfer">{t('subscription.payment.methodBank')}</option>
            <option value="easypaisa">{t('subscription.payment.methodEasypaisa')}</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileUrl(file ? URL.createObjectURL(file) : null);
              setError(null);
            }}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button
            disabled={!fileUrl || submit.isPending}
            onClick={() => {
              setError(null);
              void submit
                .mutateAsync({
                  organizationId: organization.id,
                  paymentMethod: method,
                  localProofUri: fileUrl!,
                  amount: PAYMENT_CONFIG.monthlySubscriptionPrice,
                  currency: PAYMENT_CONFIG.currency,
                })
                .catch((e) => setError(getSubscriptionErrorMessage(e)));
            }}
          >
            {t('subscription.payment.submit')}
          </Button>
        </Card>
      )}
    </div>
  );
}
