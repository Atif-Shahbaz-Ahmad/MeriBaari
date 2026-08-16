import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatSubscriptionPrice } from '@/config/payment';
import { getOrganizationCategoryLabel } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getSubscriptionErrorMessage } from '@/domain/errors/subscription-error';
import type { AdminBusinessSummary, SubscriptionPayment } from '@/domain/models/subscription';
import { pushAdminBusiness, pushAdminPayment } from '@/features/admin/navigation';
import {
  useAdminActiveBusinesses,
  useAdminPayments,
  useAdminSubscriptionStats,
} from '@/features/subscription/hooks/use-subscription';
import { useAuth } from '@/hooks/use-auth';
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  const theme = useTheme();
  return (
    <Card style={[styles.stat, { borderColor: accent }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, signOut, isLoading: signingOut } = useAuth();
  const stats = useAdminSubscriptionStats();
  const payments = useAdminPayments('pending');
  const businesses = useAdminActiveBusinesses();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([stats.refetch(), payments.refetch(), businesses.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [stats, payments, businesses]);

  if (stats.isLoading || payments.isLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={5} variant="detail" />
      </Screen>
    );
  }

  if (stats.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('admin.dashboard.loadError')}
          description={getSubscriptionErrorMessage(stats.error)}
          onRetry={() => void stats.refetch()}
        />
      </Screen>
    );
  }

  const summary = stats.data;
  const rows: SubscriptionPayment[] = payments.data ?? [];
  const live: AdminBusinessSummary[] = businesses.data ?? [];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(360)} style={styles.padded}>
          <Text style={[styles.kicker, { color: theme.textSecondary }]}>
            {t('admin.dashboard.kicker')}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('admin.dashboard.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {user?.fullName ?? user?.email ?? t('admin.dashboard.admin')}
          </Text>
        </Animated.View>

        <View style={styles.padded}>
          <View style={styles.statsRow}>
            <StatCard
              label={t('admin.dashboard.pending')}
              value={summary?.pendingPayments ?? 0}
              accent={Colors.accent}
            />
            <StatCard
              label={t('admin.dashboard.active')}
              value={summary?.activeBusinesses ?? 0}
              accent={Colors.primary}
            />
          </View>
        </View>

        <View style={styles.padded}>
          <SectionHeader
            title={t('admin.dashboard.requestsTitle')}
            subtitle={t('admin.dashboard.requestsSubtitle')}
          />
          {payments.isError ? (
            <ErrorState
              title={t('admin.dashboard.loadError')}
              description={getSubscriptionErrorMessage(payments.error)}
              onRetry={() => void payments.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title={t('admin.dashboard.emptyTitle')}
              description={t('admin.dashboard.emptyBody')}
            />
          ) : (
            rows.map((payment) => (
              <Pressable
                key={payment.id}
                onPress={() => pushAdminPayment(payment.id)}
                style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={[styles.rowTitle, { color: theme.text }]}>
                  {payment.organizationName ?? t('admin.dashboard.unknownBusiness')}
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {payment.ownerName ?? t('admin.dashboard.unknownOwner')} ·{' '}
                  {formatSubscriptionPrice(payment.amount)}
                </Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {formatWhen(payment.submittedAt)}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.padded}>
          <SectionHeader
            title={t('admin.dashboard.businessesTitle')}
            subtitle={t('admin.dashboard.businessesSubtitle')}
          />
          {businesses.isError ? (
            <ErrorState
              title={t('admin.dashboard.loadError')}
              description={getSubscriptionErrorMessage(businesses.error)}
              onRetry={() => void businesses.refetch()}
            />
          ) : businesses.isLoading ? (
            <LoadingSkeleton count={3} variant="list" />
          ) : live.length === 0 ? (
            <EmptyState
              title={t('admin.dashboard.businessesEmptyTitle')}
              description={t('admin.dashboard.businessesEmptyBody')}
            />
          ) : (
            live.map((business) => (
              <Pressable
                key={business.id}
                onPress={() => pushAdminBusiness(business.id)}
                style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={[styles.rowTitle, { color: theme.text }]}>{business.name}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {getOrganizationCategoryLabel(business.category as OrganizationCategory)}
                  {business.city ? ` · ${business.city}` : ''}
                </Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {business.ownerName ?? t('admin.dashboard.unknownOwner')}
                  {business.phone ? ` · ${business.phone}` : ''}
                  {business.adminHidden
                    ? ` · ${t('admin.business.hidden')}`
                    : ''}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.padded}>
          <Text
            style={[styles.signOut, { color: Colors.error }]}
            onPress={() => {
              if (signingOut) return;
              void signOut();
            }}
          >
            {signingOut ? t('common.signingOut') : t('common.signOut')}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  kicker: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
  },
  statValue: {
    ...Typography.h2,
  },
  statLabel: {
    ...Typography.caption,
  },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 4,
  },
  rowTitle: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.caption,
  },
  signOut: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
