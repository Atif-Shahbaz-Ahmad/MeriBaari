import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

interface ProgressCardProps {
  currentServing: string;
  counter?: string;
  sequence: string[];
  yourTicket: string;
}

export function ProgressCard({
  currentServing,
  counter,
  sequence,
  yourTicket,
}: ProgressCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: theme.text }]}>Live Progress</Text>

      <View style={styles.sequence}>
        {sequence.map((ticket, index) => {
          const isCurrent = ticket === currentServing;
          const isYou = ticket === yourTicket;
          const isPast = index < sequence.indexOf(currentServing);

          return (
            <View key={`${ticket}-${index}`} style={styles.step}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isCurrent
                      ? Colors.secondary
                      : isYou
                        ? Colors.primary
                        : isPast
                          ? theme.tints.secondary.bgStrong
                          : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dotText,
                    {
                      color: isCurrent || isYou ? Colors.textInverse : theme.textSecondary,
                    },
                  ]}
                >
                  {ticket.split('-')[1] ?? ticket}
                </Text>
              </View>
              {index < sequence.length - 1 ? (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: isPast || isCurrent ? Colors.secondary : theme.border },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.servingRow}>
        <View style={[styles.servingBlock, { backgroundColor: theme.background }]}>
          <Text style={[styles.servingLabel, { color: theme.textMuted }]}>Current Serving</Text>
          <Text style={[styles.servingValue, { color: theme.text }]}>{currentServing}</Text>
        </View>
        {counter ? (
          <View style={[styles.servingBlock, { backgroundColor: theme.tints.primary.bg }]}>
            <Text style={[styles.servingLabel, { color: theme.primary }]}>Counter</Text>
            <Text style={[styles.servingValue, { color: theme.primary }]}>{counter}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  title: {
    ...Typography.h3,
  },
  sequence: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    ...Typography.caption,
    fontFamily: Typography.small.fontFamily,
  },
  line: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  servingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  servingBlock: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  servingLabel: {
    ...Typography.caption,
  },
  servingValue: {
    ...Typography.h3,
  },
});
