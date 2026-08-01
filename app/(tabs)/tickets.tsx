import { StyleSheet, Text, View } from 'react-native';
import { QrCode } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockCurrentTicket } from '@/features/home/mock-data';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { formatWaitTime } from '@/utils/formatting';

export default function TicketsScreen() {
  const theme = useTheme();
  const ticket = mockCurrentTicket;

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>My Tickets</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Active and recent queue tickets
        </Text>

        <Card style={styles.ticketCard} padded={false}>
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.ticketHeaderLabel}>Your Ticket</Text>
              <Text style={styles.ticketHeaderTitle}>{ticket.locationName}</Text>
              <Text style={styles.ticketHeaderMeta}>{ticket.serviceName}</Text>
            </View>
            <StatusBadge status="live" />
          </View>

          <View style={[styles.ticketBody, { backgroundColor: theme.card }]}>
            <View style={styles.ticketMetaRow}>
              <View>
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Ticket</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>{ticket.ticketNumber}</Text>
              </View>
              <View>
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Est. Wait</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>
                  {formatWaitTime(ticket.estimatedWaitMinutes)}
                </Text>
              </View>
            </View>

            <View style={[styles.qrBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <QrCode size={120} color={theme.text} strokeWidth={1.5} />
              <Text style={[styles.qrHint, { color: theme.textMuted }]}>
                QR tickets arrive in Day 2
              </Text>
            </View>

            <Button title="Save Ticket" variant="secondary" onPress={() => undefined} />
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  ticketCard: {
    overflow: 'hidden',
  },
  ticketHeader: {
    backgroundColor: Colors.secondary,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketHeaderLabel: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.85)',
  },
  ticketHeaderTitle: {
    ...Typography.h2,
    color: Colors.textInverse,
    marginTop: Spacing.xs,
  },
  ticketHeaderMeta: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  ticketBody: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    ...Typography.caption,
  },
  metaValue: {
    ...Typography.h2,
    marginTop: Spacing.xs,
  },
  qrBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  qrHint: {
    ...Typography.caption,
  },
});
