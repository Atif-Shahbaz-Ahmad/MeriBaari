import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BellRing, CheckCircle2, Ticket } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { mockNotifications } from '@/features/home/mock-data';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

const ICON_MAP = {
  reminder: { Icon: BellRing, color: Colors.accent, bg: Colors.accent50 },
  joined: { Icon: Ticket, color: Colors.primary, bg: Colors.primary50 },
  completed: { Icon: CheckCircle2, color: Colors.secondary, bg: Colors.secondary50 },
} as const;

export default function NotificationsScreen() {
  const theme = useTheme();
  const groups = ['Today', 'Yesterday'] as const;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Stay updated on your queues
          </Text>
        </Animated.View>

        {groups.map((group, groupIndex) => {
          const items = mockNotifications.filter((n) => n.group === group);
          if (!items.length) return null;

          return (
            <Animated.View
              key={group}
              entering={FadeInDown.delay(80 * (groupIndex + 1)).duration(400)}
              style={styles.group}
            >
              <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{group}</Text>
              <View style={styles.stack}>
                {items.map((item) => {
                  const config = ICON_MAP[item.type];
                  const Icon = config.Icon;
                  return (
                    <Card key={item.id} style={styles.card}>
                      <View style={[styles.icon, { backgroundColor: config.bg }]}>
                        <Icon size={18} color={config.color} strokeWidth={2} />
                      </View>
                      <View style={styles.body}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text style={[styles.itemBody, { color: theme.textSecondary }]}>
                          {item.body}
                        </Text>
                      </View>
                      <Text style={[styles.time, { color: theme.textMuted }]}>{item.time}</Text>
                    </Card>
                  );
                })}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  padded: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
  },
  group: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  groupTitle: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stack: {
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    ...Typography.bodyMedium,
  },
  itemBody: {
    ...Typography.caption,
  },
  time: {
    ...Typography.caption,
  },
});
