import { StyleSheet, Text, View } from 'react-native';
import { BellRing, CheckCircle2, Ticket, XCircle } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/utils/formatting';
import type { ActivityItem } from '@/types';

const TYPE_STYLE = {
  joined: { icon: Ticket, color: Colors.primary, bg: Colors.primary50 },
  completed: { icon: CheckCircle2, color: Colors.secondary, bg: Colors.secondary50 },
  reminder: { icon: BellRing, color: Colors.accent, bg: Colors.accent50 },
  cancelled: { icon: XCircle, color: Colors.error, bg: Colors.error50 },
} as const;

interface ActivityCardProps {
  item: ActivityItem;
}

export function ActivityCard({ item }: ActivityCardProps) {
  const theme = useTheme();
  const config = TYPE_STYLE[item.type];
  const Icon = config.icon;

  return (
    <Card elevated={false} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Icon size={18} color={config.color} strokeWidth={2} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
      </View>
      <Text style={[styles.time, { color: theme.textMuted }]}>
        {formatRelativeTime(item.timestamp)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.bodyMedium,
  },
  subtitle: {
    ...Typography.caption,
  },
  time: {
    ...Typography.caption,
  },
});
