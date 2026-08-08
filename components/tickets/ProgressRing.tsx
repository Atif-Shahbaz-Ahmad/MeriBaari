import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useEffect } from 'react';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0–1 progress toward being served */
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  value?: string;
  color?: string;
}

export function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 12,
  label = 'Progress',
  value,
  color = Colors.primary,
}: ProgressRingProps) {
  const theme = useTheme();
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const displayValue = value ?? `${Math.round(progress * 100)}%`;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
          {displayValue}
        </Text>
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
  },
  value: {
    ...Typography.h2,
    textAlign: 'center',
  },
  label: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
