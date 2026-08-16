import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
  index?: number;
}

export function SettingsGroup({ title, children, index = 0 }: SettingsGroupProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 50).duration(400)}
      style={styles.wrap}
      accessibilityRole="summary"
    >
      <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
      <Card padded={false}>{children}</Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.xs,
  },
});
