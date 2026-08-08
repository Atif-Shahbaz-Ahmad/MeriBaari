import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface BusinessStatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
  accent?: 'blue' | 'green' | 'orange' | 'red';
  index?: number;
  style?: ViewStyle;
}

const ACCENT = {
  blue: { bg: Colors.primary50 },
  green: { bg: Colors.secondary50 },
  orange: { bg: Colors.accent50 },
  red: { bg: Colors.error50 },
} as const;

export function BusinessStatCard({
  label,
  value,
  suffix = '',
  icon,
  accent = 'blue',
  index = 0,
  style,
}: BusinessStatCardProps) {
  const theme = useTheme();
  const [display, setDisplay] = useState(0);
  const palette = ACCENT[accent];

  useEffect(() => {
    const start = Date.now();
    const duration = 900;
    const frame = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t >= 1) clearInterval(frame);
    }, 32);

    return () => clearInterval(frame);
  }, [value]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(400)}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}${suffix}`}
    >
      {icon ? (
        <View style={[styles.icon, { backgroundColor: palette.bg }]}>{icon}</View>
      ) : null}
      <Text style={[styles.value, { color: theme.text }]} allowFontScaling>
        {`${display}${suffix}`}
      </Text>
      <Text style={[styles.label, { color: theme.textMuted }]} allowFontScaling>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    ...Typography.h2,
    letterSpacing: -0.5,
  },
  label: {
    ...Typography.caption,
  },
});
