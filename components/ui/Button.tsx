import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const palette = getVariantStyles(variant, theme.card === Colors.card);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, { color: palette.text }]}>{title}</Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}

function getVariantStyles(variant: ButtonVariant, isLight: boolean) {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: isLight ? Colors.primary50 : Colors.darkBorder,
        borderColor: 'transparent',
        text: Colors.primary,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: isLight ? Colors.border : Colors.darkBorder,
        text: isLight ? Colors.text : Colors.textInverse,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        text: Colors.primary,
      };
    case 'danger':
      return {
        backgroundColor: Colors.error,
        borderColor: 'transparent',
        text: Colors.textInverse,
      };
    case 'primary':
    default:
      return {
        backgroundColor: Colors.primary,
        borderColor: 'transparent',
        text: Colors.textInverse,
      };
  }
}

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
  md: {
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
  },
});

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  label: {
    ...Typography.button,
  },
});
