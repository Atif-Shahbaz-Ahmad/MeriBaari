import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatQuickAction } from '@/features/chatbot/quick-actions';
import { useTheme } from '@/hooks/use-theme';

type ChatQuickActionsProps = {
  actions: ChatQuickAction[];
  disabled?: boolean;
  onSelect: (action: ChatQuickAction) => void;
};

export function ChatQuickActions({
  actions,
  disabled,
  onSelect,
}: ChatQuickActionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          disabled={disabled}
          onPress={() => onSelect(action)}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={[
            styles.chip,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          <Text style={[styles.label, { color: Colors.primary }]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  label: {
    ...Typography.small,
    fontFamily: Typography.bodyMedium.fontFamily,
  },
});
