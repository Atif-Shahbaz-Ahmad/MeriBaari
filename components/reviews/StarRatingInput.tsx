import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';

type StarRatingInputProps = {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  accessibilityLabel?: string;
};

export function StarRatingInput({
  value,
  onChange,
  size = 32,
  readonly = false,
  accessibilityLabel = 'Rating',
}: StarRatingInputProps) {
  const theme = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 1, max: 5, now: value }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const icon = (
          <Star
            size={size}
            color={filled ? Colors.secondary : theme.border}
            fill={filled ? Colors.secondary : 'transparent'}
            strokeWidth={2}
          />
        );

        if (readonly || !onChange) {
          return (
            <View key={star} style={styles.starHit}>
              {icon}
            </View>
          );
        }

        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            style={styles.starHit}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            accessibilityState={{ selected: filled }}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

type ReviewStarsProps = {
  rating: number;
  size?: number;
};

export function ReviewStars({ rating, size = 14 }: ReviewStarsProps) {
  return <StarRatingInput value={rating} size={size} readonly />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  starHit: {
    padding: Spacing.xs,
  },
});
