import { Pressable, StyleSheet, View } from 'react-native';
import { Bot } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { useTranslation } from '@/hooks/use-translation';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ChatFloatingButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function ChatFloatingButton({ onPress, accessibilityLabel }: ChatFloatingButtonProps) {
  const { t, isRTL } = useTranslation();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, isRTL ? styles.left : styles.right]}
    >
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? t('chatbot.openA11y')}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.94);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[styles.button, Shadows.soft, animatedStyle]}
      >
        <Bot size={26} color={Colors.textInverse} strokeWidth={2} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: Spacing.lg,
    zIndex: 20,
  },
  right: {
    right: Spacing.md,
  },
  left: {
    left: Spacing.md,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
