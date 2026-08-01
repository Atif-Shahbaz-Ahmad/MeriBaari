import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock3, Heart, History, QrCode, Search } from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import type { QuickAction } from '@/types';

const ICON_MAP = {
  scan: QrCode,
  search: Search,
  history: History,
  favorites: Heart,
} as const;

interface QuickActionButtonProps {
  action: QuickAction;
  onPress?: () => void;
}

export function QuickActionButton({ action, onPress }: QuickActionButtonProps) {
  const theme = useTheme();
  const Icon = ICON_MAP[action.icon] ?? Clock3;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        Shadows.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon size={20} color={Colors.primary} strokeWidth={2} />
      </View>
      <Text style={[styles.label, { color: theme.text }]}>{action.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.small,
  },
});
