import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ReviewStars } from '@/components/reviews/StarRatingInput';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { Review } from '@/domain/models';
import { useTheme } from '@/hooks/use-theme';
import { formatTicketDate } from '@/utils/formatting';

type ReviewCardProps = {
  review: Review;
  index?: number;
};

export function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const theme = useTheme();
  const name = review.reviewerName?.trim() || 'Customer';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(360)}
      style={[
        styles.card,
        Shadows.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {name}
          </Text>
          {review.ticketNumber ? (
            <Text style={[styles.meta, { color: theme.textMuted }]}>
              {review.ticketNumber}
            </Text>
          ) : null}
        </View>
        <ReviewStars rating={review.rating} />
      </View>

      {review.comment ? (
        <Text style={[styles.comment, { color: theme.textSecondary }]}>
          {review.comment}
        </Text>
      ) : null}

      <Text style={[styles.date, { color: theme.textMuted }]}>
        {formatTicketDate(review.createdAt)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyMedium,
  },
  meta: {
    ...Typography.caption,
    color: Colors.primary,
  },
  comment: {
    ...Typography.body,
  },
  date: {
    ...Typography.caption,
  },
});
