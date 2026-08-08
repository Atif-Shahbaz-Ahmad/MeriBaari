import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, padded = true, elevated = true, style, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        elevated ? Shadows.card : Shadows.none,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.md,
  },
});
