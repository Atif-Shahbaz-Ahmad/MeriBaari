import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Star } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { StatisticCard } from '@/components/ui/StatisticCard';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getReviewErrorMessage } from '@/domain/errors/review-error';
import {
  pushCreateOrganization,
  pushOwnerHistory,
} from '@/features/business/navigation';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useOrganizationReviews } from '@/features/reviews/hooks/use-reviews';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function BusinessReviewsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    data: organization,
    isLoading: orgLoading,
    isError: orgError,
    error: orgErr,
    refetch: refetchOrg,
  } = useMyOrganization();

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
    error: reviewsErr,
    refetch: refetchReviews,
    isRefetching,
  } = useOrganizationReviews(organization?.id, Boolean(organization?.id));

  if (orgLoading) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('reviews.ownerTitle')}
            subtitle={t('reviews.ownerSubtitle')}
            onBack={() => router.back()}
          />
        </View>
        <View style={styles.padded}>
          <LoadingSkeleton count={4} variant="ticket" />
        </View>
      </Screen>
    );
  }

  if (orgError) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('reviews.ownerTitle')}
            onBack={() => router.back()}
          />
        </View>
        <ErrorState
          title={t('reviews.ownerLoadError')}
          description={getReviewErrorMessage(orgErr)}
          onRetry={() => void refetchOrg()}
        />
      </Screen>
    );
  }

  if (!organization) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('reviews.ownerTitle')}
            onBack={() => router.back()}
          />
        </View>
        <EmptyState
          title={t('history.owner.noOrgTitle')}
          description={t('history.owner.noOrgDescription')}
          actionLabel={t('history.owner.createOrg')}
          onActionPress={pushCreateOrganization}
        />
      </Screen>
    );
  }

  if (reviewsLoading) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('reviews.ownerTitle')}
            subtitle={organization.name}
            onBack={() => router.back()}
          />
        </View>
        <View style={styles.padded}>
          <LoadingSkeleton count={4} variant="ticket" />
        </View>
      </Screen>
    );
  }

  if (reviewsError) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <View style={styles.padded}>
          <FlowHeader
            title={t('reviews.ownerTitle')}
            subtitle={organization.name}
            onBack={() => router.back()}
          />
        </View>
        <ErrorState
          title={t('reviews.ownerLoadError')}
          description={getReviewErrorMessage(reviewsErr)}
          onRetry={() => void refetchReviews()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetchReviews()}
            tintColor={Colors.primary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(360)} style={styles.padded}>
          <FlowHeader
            title={t('reviews.ownerTitle')}
            subtitle={t('reviews.ownerSubtitleWithOrg', {
              name: organization.name,
            })}
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(40).duration(360)}
          style={styles.padded}
        >
          <View style={styles.stats}>
            <StatisticCard
              label={t('reviews.avgRating')}
              value={
                organization.rating > 0
                  ? organization.rating.toFixed(1)
                  : '—'
              }
              icon={<Star size={16} color={Colors.secondary} />}
            />
            <StatisticCard
              label={t('reviews.reviewCount')}
              value={String(organization.reviewCount ?? reviews.length)}
              icon={<Star size={16} color={Colors.primary} />}
            />
          </View>
        </Animated.View>

        {reviews.length === 0 ? (
          <EmptyState
            title={t('reviews.ownerEmptyTitle')}
            description={t('reviews.ownerEmptyDescription')}
            actionLabel={t('profile.history')}
            onActionPress={pushOwnerHistory}
          />
        ) : (
          <View style={styles.padded}>
            <Text style={[styles.section, { color: theme.textSecondary }]}>
              {t('reviews.recent')}
            </Text>
            <View style={styles.stack}>
              {reviews.map((review, index) => (
                <ReviewCard key={review.id} review={review} index={index} />
              ))}
            </View>
          </View>
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
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  section: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  stack: {
    gap: Spacing.sm,
  },
});
