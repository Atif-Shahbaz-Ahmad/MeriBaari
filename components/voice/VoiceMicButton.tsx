import { Pressable, StyleSheet } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import type { VoiceSessionStatus } from '@/domain/models/voice';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type VoiceMicButtonProps = {
  status: VoiceSessionStatus;
  disabled?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

export function VoiceMicButton({
  status,
  disabled,
  accessibilityLabel,
  onPress,
}: VoiceMicButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const listening = status === 'listening';
  const speaking = status === 'speaking';
  const busy = status === 'transcribing' || status === 'processing';

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.94);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.button,
        animatedStyle,
        {
          backgroundColor: listening || speaking
            ? Colors.error
            : disabled || busy
              ? theme.border
              : Colors.primary,
        },
      ]}
    >
      {listening || speaking ? (
        <Square size={16} color={Colors.textInverse} strokeWidth={2.5} fill={Colors.textInverse} />
      ) : (
        <Mic size={18} color={Colors.textInverse} strokeWidth={2} />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
