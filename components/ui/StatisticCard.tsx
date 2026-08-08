import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface StatisticCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function StatisticCard({ label, value, icon, style }: StatisticCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.value, { color: theme.text }]} allowFontScaling>
        {value}
      </Text>
      <Text style={[styles.label, { color: theme.textMuted }]} allowFontScaling>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '30%',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    ...Typography.h3,
  },
  label: {
    ...Typography.caption,
  },
});
