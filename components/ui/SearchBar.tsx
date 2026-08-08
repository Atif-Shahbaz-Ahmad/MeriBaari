import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';

import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search organizations…',
  style,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[
        styles.container,
        { backgroundColor: theme.card, borderColor: theme.border },
        style,
      ]}
    >
      <Search size={18} color={theme.textMuted} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { color: theme.text }]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search">
          <X size={16} color={theme.textMuted} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm + 4,
  },
});
