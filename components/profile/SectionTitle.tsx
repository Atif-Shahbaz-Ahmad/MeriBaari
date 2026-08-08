import { StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export function SectionTitle({ title, subtitle, style, titleStyle }: SectionTitleProps) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={[styles.wrap, style]}>
      <Text style={[styles.title, { color: theme.text }, titleStyle]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
  },
});
