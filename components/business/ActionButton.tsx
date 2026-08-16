import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
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
  loading?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

const SOLID = {
  primary: { bg: Colors.primary, text: Colors.textInverse, border: Colors.primary },
  success: { bg: Colors.secondary, text: Colors.textInverse, border: Colors.secondary },
  warning: { bg: Colors.accent, text: Colors.text, border: Colors.accent },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  compact = false,
  style,
}: ActionButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const palette =
    variant === 'danger'
      ? {
          bg: theme.tints.error.bg,
          text: theme.tints.error.fg,
          border: theme.tints.error.border,
        }
      : variant === 'neutral'
        ? {
            bg: theme.tints.primary.bg,
            text: theme.tints.primary.fg,
            border: theme.tints.primary.border,
          }
        : SOLID[variant];
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        if (isDisabled) return;
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        icon
      )}
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
  loading = false,
}: {
  label: string;
  onPress?: () => void;
  icon: React.ReactNode;
  tint?: 'blue' | 'green' | 'orange' | 'red';
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const tintMap = {
    blue: theme.tints.primary,
    green: theme.tints.secondary,
    orange: theme.tints.accent,
    red: theme.tints.error,
  } as const;
  const palette = tintMap[tint];
  const isDisabled = Boolean(disabled || loading);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        if (isDisabled) return;
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.tile,
        {
          backgroundColor: theme.isDark ? theme.card : palette.bg,
          borderColor: theme.border,
          opacity: isDisabled ? 0.5 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: palette.bgStrong }]}>
        {loading ? <ActivityIndicator size="small" color={palette.fg} /> : icon}
      </View>
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
