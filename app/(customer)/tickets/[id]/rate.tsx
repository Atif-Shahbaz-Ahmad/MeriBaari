import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { Screen } from '@/components/layout/Screen';
import { StarRatingInput } from '@/components/reviews/StarRatingInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getQueueErrorMessage } from '@/domain/errors/queue-error';
import { getReviewErrorMessage } from '@/domain/errors/review-error';
import { useTicket } from '@/features/queue/hooks/use-queue-queries';
import {
  useCreateReview,
  useTicketReview,
} from '@/features/reviews/hooks/use-reviews';
import { AuthHref } from '@/features/auth/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

function isCompletedStatus(status: string) {
  return status === 'completed' || status === 'served';
}

export default function RateTicketScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useTicket(id);
  const {
    data: existing,
    isLoading: reviewLoading,
  } = useTicketReview(id, Boolean(id));
  const createReview = useCreateReview();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (isLoading || reviewLoading) {
    return (
      <Screen>
        <LoadingSkeleton count={3} variant="ticket" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <FlowHeader title={t('reviews.rateTitle')} onBack={() => router.back()} />
        <ErrorState
          title={t('reviews.loadTicketError')}
          description={getQueueErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  if (!ticket) {
    return (
      <Screen>
        <FlowHeader title={t('reviews.rateTitle')} onBack={() => router.back()} />
        <EmptyState
          title={t('reviews.ticketNotFound')}
          description={t('reviews.ticketNotFoundHint')}
          actionLabel={t('tickets.title')}
          onActionPress={() => router.replace(AuthHref.customerTickets)}
        />
      </Screen>
    );
  }

  if (!isCompletedStatus(ticket.status)) {
    return (
      <Screen>
        <FlowHeader title={t('reviews.rateTitle')} onBack={() => router.back()} />
        <EmptyState
          title={t('reviews.notEligibleTitle')}
          description={t('reviews.notEligibleDescription')}
          actionLabel={t('common.back')}
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  if (existing) {
    return (
      <Screen padded={false} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.padded}>
            <FlowHeader
              title={t('reviews.alreadyRatedTitle')}
              subtitle={ticket.organizationName}
              onBack={() => router.back()}
            />
          </View>
          <Animated.View
            entering={FadeInDown.duration(360)}
            style={styles.padded}
          >
            <Text style={[styles.org, { color: theme.text }]}>
              {ticket.organizationName}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {ticket.ticketNumber} · {ticket.serviceName}
            </Text>
            <StarRatingInput value={existing.rating} readonly size={28} />
            {existing.comment ? (
              <Text style={[styles.existingComment, { color: theme.textSecondary }]}>
                {existing.comment}
              </Text>
            ) : (
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                {t('reviews.noWrittenReview')}
              </Text>
            )}
          </Animated.View>
        </ScrollView>
      </Screen>
    );
  }

  const onSubmit = () => {
    if (rating < 1) {
      Alert.alert(t('reviews.ratingRequiredTitle'), t('reviews.ratingRequired'));
      return;
    }

    void (async () => {
      try {
        await createReview.mutateAsync({
          ticketId: ticket.id,
          organizationId: ticket.organizationId,
          rating,
          comment,
        });
        Alert.alert(t('reviews.thanksTitle'), t('reviews.thanksBody'), [
          { text: t('common.back'), onPress: () => router.back() },
        ]);
      } catch (e) {
        Alert.alert(t('reviews.submitError'), getReviewErrorMessage(e));
      }
    })();
  };

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(360)} style={styles.padded}>
          <FlowHeader
            title={t('reviews.rateTitle')}
            subtitle={ticket.organizationName}
            onBack={() => router.back()}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(60).duration(360)}
          style={styles.padded}
        >
          <Text style={[styles.org, { color: theme.text }]}>
            {ticket.organizationName}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {ticket.ticketNumber} · {ticket.serviceName}
          </Text>

          <Text style={[styles.label, { color: theme.text }]}>
            {t('reviews.yourRating')}
          </Text>
          <StarRatingInput
            value={rating}
            onChange={setRating}
            accessibilityLabel={t('reviews.yourRating')}
          />

          <Input
            label={t('reviews.commentLabel')}
            hint={t('reviews.commentHint')}
            value={comment}
            onChangeText={setComment}
            placeholder={t('reviews.commentPlaceholder')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.commentInput}
            maxLength={1000}
          />

          <PrimaryButton
            title={t('reviews.submit')}
            onPress={onSubmit}
            loading={createReview.isPending}
            disabled={createReview.isPending || rating < 1}
          />
        </Animated.View>
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
    gap: Spacing.md,
  },
  org: {
    ...Typography.h3,
  },
  meta: {
    ...Typography.caption,
  },
  label: {
    ...Typography.bodyMedium,
    marginTop: Spacing.sm,
  },
  commentInput: {
    minHeight: 110,
    paddingTop: Spacing.sm,
  },
  existingComment: {
    ...Typography.body,
  },
});
