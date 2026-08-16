import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Heart } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

interface FavoriteToggleButtonProps {
  isFavorite: boolean;
  loading?: boolean;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
}

/**
 * Heart toggle for organization favorites.
 * Use as a nested Pressable — RN delivers the press to the inner control.
 */
export function FavoriteToggleButton({
  isFavorite,
  loading = false,
  onPress,
  size = 20,
  style,
}: FavoriteToggleButtonProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => {
        if (!loading) onPress?.();
      }}
      hitSlop={10}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? t('favorites.removeA11y') : t('favorites.addA11y')
      }
      accessibilityState={{ selected: isFavorite, busy: loading, disabled: loading }}
      style={[
        styles.base,
        {
          backgroundColor: isFavorite ? theme.tints.error.bg : theme.background,
          borderColor: isFavorite ? theme.tints.error.border : theme.border,
          opacity: loading ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFavorite ? Colors.error : Colors.primary} />
      ) : (
        <Heart
          size={size}
          color={isFavorite ? Colors.error : theme.textMuted}
          fill={isFavorite ? Colors.error : 'transparent'}
          strokeWidth={2}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
});
