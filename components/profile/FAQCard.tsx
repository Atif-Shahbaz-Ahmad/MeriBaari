import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import type { FaqItem } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQCardProps {
  item: FaqItem;
  index?: number;
}

export function FAQCard({ item, index = 0 }: FAQCardProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 220 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(380)}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={item.question}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: open ? theme.tints.primary.border : theme.border,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.question, { color: theme.text }]}>{item.question}</Text>
          <Animated.View style={chevronStyle}>
            <ChevronDown size={18} color={theme.textMuted} />
          </Animated.View>
        </View>
        {open ? (
          <Text style={[styles.answer, { color: theme.textSecondary }]}>{item.answer}</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
    minHeight: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  question: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  answer: {
    ...Typography.body,
  },
});
