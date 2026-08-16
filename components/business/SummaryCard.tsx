import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'blue' | 'green' | 'orange' | 'red';
  index?: number;
  style?: ViewStyle;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'blue',
  index = 0,
  style,
}: SummaryCardProps) {
  const theme = useTheme();
  const accentBg = {
    blue: theme.tints.primary.bg,
    green: theme.tints.secondary.bg,
    orange: theme.tints.accent.bg,
    red: theme.tints.error.bg,
  }[accent];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(380)} style={[{ flex: 1 }, style]}>
      <Card style={[styles.card, { backgroundColor: theme.isDark ? theme.card : accentBg }]}>
        <View style={styles.top}>
          {icon}
          <Text style={[styles.title, { color: theme.textSecondary }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
    minHeight: 110,
    borderRadius: Radius.xl,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.caption,
    flex: 1,
  },
  value: {
    ...Typography.h2,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...Typography.caption,
  },
});
