import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PreferenceSwitch } from '@/components/profile/PreferenceSwitch';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface SettingsItemProps {
  label: string;
  description?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  danger?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsItem({
  label,
  description,
  value,
  icon,
  onPress,
  showDivider = true,
  danger = false,
  switchValue,
  onSwitchChange,
  accessibilityHint,
}: SettingsItemProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const isSwitch = typeof switchValue === 'boolean' && onSwitchChange;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <>
      <View style={styles.left}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <View style={styles.copy}>
          <Text style={[styles.label, { color: danger ? Colors.error : theme.text }]}>{label}</Text>
          {description ? (
            <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        {isSwitch ? (
          <PreferenceSwitch value={switchValue} onValueChange={onSwitchChange} label={label} />
        ) : (
          <>
            {value ? (
              <Text style={[styles.value, { color: theme.textMuted }]} numberOfLines={1}>
                {value}
              </Text>
            ) : null}
            {onPress ? <ChevronRight size={18} color={theme.textMuted} /> : null}
          </>
        )}
      </View>
    </>
  );

  if (isSwitch) {
    return (
      <View
        style={[
          styles.row,
          showDivider && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
          },
        ]}
        accessibilityRole="none"
      >
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? (value ? `Current value ${value}` : undefined)}
      onPressIn={() => {
        if (onPress) scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.row,
        animatedStyle,
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Typography.bodyMedium,
  },
  description: {
    ...Typography.caption,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    maxWidth: '40%',
  },
  value: {
    ...Typography.small,
    textTransform: 'capitalize',
  },
});
