import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
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
import type { AppLanguage } from '@/types';

const LANGUAGE_OPTIONS = dataAccess.LANGUAGE_OPTIONS;

interface LanguageSelectorProps {
  value: AppLanguage;
  onChange: (value: AppLanguage) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.stack} accessibilityRole="radiogroup">
      {LANGUAGE_OPTIONS.map((option, index) => {
        const selected = value === option.value;
        return (
          <LanguageOption
            key={option.value}
            label={option.label}
            nativeLabel={option.nativeLabel}
            selected={selected}
            index={index}
            borderColor={selected ? Colors.primary : theme.border}
            cardColor={theme.card}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            onPress={() => onChange(option.value)}
          />
        );
      })}
    </View>
  );
}

function LanguageOption({
  label,
  nativeLabel,
  selected,
  index,
  borderColor,
  cardColor,
  textColor,
  mutedColor,
  onPress,
}: {
  label: string;
  nativeLabel: string;
  selected: boolean;
  index: number;
  borderColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(380)}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label} (${nativeLabel})`}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[styles.option, animatedStyle, { backgroundColor: cardColor, borderColor }]}
      >
        <View style={styles.copy}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          <Text style={[styles.native, { color: mutedColor }]}>{nativeLabel}</Text>
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
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copy: {
    gap: 2,
  },
  label: {
    ...Typography.bodyMedium,
  },
  native: {
    ...Typography.caption,
  },
});
