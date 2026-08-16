import { StyleSheet, Text, View } from 'react-native';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  TriangleAlert,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { SubscriptionStatus } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

interface SubscriptionStatusCardProps {
  status: SubscriptionStatus;
  /** When subscription is active, customers only see the business if this is true. */
  visibleToCustomers?: boolean;
  adminHidden?: boolean;
  adminHiddenReason?: string | null;
  rejectionReason?: string | null;
  cooldownUntil?: Date | null;
  onSubscribe?: () => void;
  onResubmit?: () => void;
}

export function SubscriptionStatusCard({
  status,
  visibleToCustomers = true,
  adminHidden = false,
  adminHiddenReason,
  rejectionReason,
  cooldownUntil,
  onSubscribe,
  onResubmit,
}: SubscriptionStatusCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (status === 'active') {
    const publicLive = visibleToCustomers && !adminHidden;
    const tint = publicLive ? theme.tints.secondary : theme.tints.accent;
    const cooldownLabel =
      cooldownUntil && cooldownUntil.getTime() > Date.now()
        ? cooldownUntil.toLocaleDateString()
        : null;
    return (
      <Card
        style={[
          styles.card,
          {
            borderColor: adminHidden ? Colors.error : tint.border,
            backgroundColor: adminHidden ? theme.tints.error.bg : tint.bg,
          },
        ]}
      >
        <View style={styles.row}>
          {adminHidden ? (
            <TriangleAlert size={22} color={Colors.error} />
          ) : (
            <CheckCircle2 size={22} color={tint.fg} />
          )}
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>
              {adminHidden
                ? t('subscription.status.adminHiddenTitle')
                : publicLive
                  ? t('subscription.status.activeTitle')
                  : t('subscription.status.activeHiddenTitle')}
            </Text>
            <Text style={[styles.body, { color: theme.text }]}>
              {adminHidden
                ? t('subscription.status.adminHiddenBody')
                : publicLive
                  ? t('subscription.status.activeBody')
                  : t('subscription.status.activeHiddenBody')}
            </Text>
            {adminHidden && adminHiddenReason ? (
              <Text style={[styles.reason, { color: theme.text }]}>
                {t('subscription.status.reasonLabel')}: {adminHiddenReason}
              </Text>
            ) : null}
            {cooldownLabel ? (
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {t('subscription.status.cooldownBody', { date: cooldownLabel })}
              </Text>
            ) : onSubscribe ? (
              <Button
                title={t('subscription.status.subscribe')}
                size="sm"
                onPress={onSubscribe}
                style={styles.action}
              />
            ) : null}
          </View>
        </View>
      </Card>
    );
  }

  if (status === 'pending_approval') {
    return (
      <Card style={[styles.card, { borderColor: Colors.accent }]}>
        <View style={styles.row}>
          <Clock3 size={22} color={Colors.accent} />
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('subscription.status.pendingTitle')}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t('subscription.status.pendingBody')}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  if (status === 'rejected') {
    return (
      <Card style={[styles.card, { borderColor: Colors.error }]}>
        <View style={styles.row}>
          <TriangleAlert size={22} color={Colors.error} />
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('subscription.status.rejectedTitle')}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t('subscription.status.rejectedBody')}
            </Text>
            {rejectionReason ? (
              <Text style={[styles.reason, { color: theme.text }]}>
                {t('subscription.status.reasonLabel')}: {rejectionReason}
              </Text>
            ) : null}
            <Button
              title={t('subscription.status.resubmit')}
              size="sm"
              onPress={onResubmit}
              style={styles.action}
            />
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { borderColor: Colors.primary }]}>
      <View style={styles.row}>
        <CreditCard size={22} color={Colors.primary} />
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('subscription.status.hiddenTitle')}
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {t('subscription.status.hiddenBody')}
          </Text>
          <Button
            title={t('subscription.status.subscribe')}
            size="sm"
            onPress={onSubscribe}
            style={styles.action}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.bodyMedium,
  },
  body: {
    ...Typography.caption,
  },
  reason: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  action: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: Radius.lg,
  },
});
