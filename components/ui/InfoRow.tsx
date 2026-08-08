import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface InfoRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export function InfoRow({ label, value, icon }: InfoRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon}
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  label: {
    ...Typography.body,
  },
  value: {
    ...Typography.bodyMedium,
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '55%',
  },
});
