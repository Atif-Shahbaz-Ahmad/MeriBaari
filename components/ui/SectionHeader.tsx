import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  style,
}: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Text style={styles.action} onPress={onActionPress}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h3,
  },
  subtitle: {
    ...Typography.small,
    fontFamily: Typography.body.fontFamily,
  },
  action: {
    ...Typography.small,
    color: Colors.primary,
    paddingTop: 2,
  },
});
