import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Building2, Check, UserRound } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { dataAccess } from '@/data';
import type { SelectableUserRole } from '@/features/auth/roles';

const ROLE_CARD_COPY = dataAccess.ROLE_CARD_COPY;

interface RoleSelectCardProps {
  role: SelectableUserRole;
  selected: boolean;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RoleSelectCard({ role, selected, onPress, index = 0 }: RoleSelectCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const copy = ROLE_CARD_COPY[role];
  const Icon = role === 'business' ? Building2 : UserRound;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(420)}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${copy.title}. ${copy.description}`}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.card,
          Shadows.card,
          animatedStyle,
          {
            backgroundColor: theme.card,
            borderColor: selected ? Colors.primary : theme.border,
            borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.icon,
              { backgroundColor: selected ? Colors.primary : theme.tints.primary.bg },
            ]}
          >
            <Icon
              size={22}
              color={selected ? Colors.textInverse : Colors.primary}
              strokeWidth={2}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>{copy.title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {copy.description}
            </Text>
          </View>
          <View
            style={[
              styles.check,
              {
                backgroundColor: selected ? Colors.primary : theme.background,
                borderColor: selected ? Colors.primary : theme.border,
              },
            ]}
          >
            {selected ? <Check size={14} color={Colors.textInverse} strokeWidth={3} /> : null}
          </View>
        </View>

        <View style={styles.bullets}>
          {copy.bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
              <Text style={[styles.bullet, { color: theme.text }]}>{bullet}</Text>
            </View>
          ))}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.h3,
  },
  description: {
    ...Typography.body,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullets: {
    gap: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bullet: {
    ...Typography.bodyMedium,
  },
});
