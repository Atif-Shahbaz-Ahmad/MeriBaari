import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface FlowHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  style?: ViewStyle;
}

export function FlowHeader({ title, subtitle, onBack, style }: FlowHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={[styles.back, { backgroundColor: theme.card, borderColor: theme.border }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={theme.text} strokeWidth={2} />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 44,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.h2,
  },
  subtitle: {
    ...Typography.small,
    fontFamily: Typography.body.fontFamily,
  },
});
