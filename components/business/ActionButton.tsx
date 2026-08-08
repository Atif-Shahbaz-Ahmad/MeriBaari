import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

export type ActionButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface ActionButtonProps {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

const VARIANT = {
  primary: { bg: Colors.primary, text: Colors.textInverse, border: Colors.primary },
  success: { bg: Colors.secondary, text: Colors.textInverse, border: Colors.secondary },
  warning: { bg: Colors.accent, text: Colors.text, border: Colors.accent },
  danger: { bg: Colors.error50, text: Colors.error, border: Colors.error100 },
  neutral: { bg: Colors.primary50, text: Colors.primary700, border: Colors.primary100 },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  compact = false,
  style,
}: ActionButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const palette = VARIANT[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        {
          backgroundColor: variant === 'neutral' ? (theme.card === Colors.card ? palette.bg : Colors.darkBorder) : palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, compact && styles.labelCompact, { color: palette.text }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/** Grid of quick action tiles used on the business dashboard. */
export function QuickActionTile({
  label,
  onPress,
  icon,
  tint = 'blue',
  disabled,
}: {
  label: string;
  onPress?: () => void;
  icon: React.ReactNode;
  tint?: 'blue' | 'green' | 'orange' | 'red';
  disabled?: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const tintMap = {
    blue: { bg: Colors.primary50, iconBg: Colors.primary100, color: Colors.primary },
    green: { bg: Colors.secondary50, iconBg: Colors.secondary100, color: Colors.secondary600 },
    orange: { bg: Colors.accent50, iconBg: Colors.accent100, color: '#B45309' },
    red: { bg: Colors.error50, iconBg: Colors.error100, color: Colors.error },
  } as const;
  const palette = tintMap[tint];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.tile,
        {
          backgroundColor: theme.card === Colors.card ? palette.bg : theme.card,
          borderColor: theme.border,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: palette.iconBg }]}>{icon}</View>
      <Text style={[styles.tileLabel, { color: theme.text }]} numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
  },
  regular: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: Spacing.sm + 2,
  },
  label: {
    ...Typography.small,
    fontFamily: Typography.button.fontFamily,
  },
  labelCompact: {
    ...Typography.caption,
    fontFamily: Typography.small.fontFamily,
  },
  tile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    ...Typography.small,
  },
});
