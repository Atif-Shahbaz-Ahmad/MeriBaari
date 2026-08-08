import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Monitor, Moon, Sun } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import type { ThemePreference } from '@/store/theme-store';

const THEME_OPTIONS = dataAccess.THEME_OPTIONS;

interface ThemeSelectorProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <View style={styles.stack} accessibilityRole="radiogroup">
      {THEME_OPTIONS.map((option, index) => (
        <ThemeOption
          key={option.value}
          label={option.label}
          description={option.description}
          selected={value === option.value}
          iconKey={option.value}
          index={index}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

function ThemeOption({
  label,
  description,
  selected,
  iconKey,
  index,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  iconKey: ThemePreference;
  index: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const Icon = ICONS[iconKey];
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(380)}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}. ${description}`}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.option,
          animatedStyle,
          {
            backgroundColor: theme.card,
            borderColor: selected ? Colors.primary : theme.border,
          },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: selected ? Colors.primary50 : theme.background }]}>
          <Icon size={20} color={selected ? Colors.primary : theme.icon} strokeWidth={2} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
        </View>
        {selected ? <Check size={18} color={Colors.primary} strokeWidth={2.5} /> : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.sm,
  },
  option: {
    minHeight: 72,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
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
});
