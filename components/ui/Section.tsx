import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface SectionProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Section({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
  style,
}: SectionProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
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
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleBlock: {
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
    color: '#2563EB',
    paddingTop: 2,
  },
});
