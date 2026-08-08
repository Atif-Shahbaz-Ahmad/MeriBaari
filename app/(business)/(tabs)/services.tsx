import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { SectionTitle } from '@/components/profile/SectionTitle';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

const MOCK_SERVICES = [
  { id: '1', name: 'General OPD Consultation', wait: '12 min', open: true },
  { id: '2', name: 'Lab — Blood Test', wait: '8 min', open: true },
  { id: '3', name: 'Cardiology Follow-up', wait: '25 min', open: false },
];

export default function BusinessServicesScreen() {
  const theme = useTheme();

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.padded}>
          <SectionTitle
            title="Services"
            subtitle="Manage the queues your organization offers"
          />
        </Animated.View>

        <View style={styles.padded}>
          {MOCK_SERVICES.map((service, index) => (
            <Animated.View
              key={service.id}
              entering={FadeInDown.delay(60 + index * 50).duration(380)}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Text style={[styles.name, { color: theme.text }]}>{service.name}</Text>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: service.open ? Colors.secondary50 : Colors.error50,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        ...Typography.caption,
                        color: service.open ? Colors.secondary600 : Colors.error,
                      }}
                    >
                      {service.open ? 'Open' : 'Paused'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  Avg. wait {service.wait}
                </Text>
              </Card>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.padded}>
          <Text style={[styles.note, { color: theme.textMuted }]}>
            Placeholder service list — create/edit flows come in the business phase.
          </Text>
        </Animated.View>
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
  card: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  name: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  pill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  meta: {
    ...Typography.caption,
  },
  note: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
