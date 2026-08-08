import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';



import { Card } from '@/components/ui/Card';

import { Colors } from '@/constants/colors';

import { Radius, Spacing } from '@/constants/spacing';

import { Typography } from '@/constants/typography';

import { useTheme } from '@/hooks/use-theme';

import type { QueueTimelineEntry } from '@/types';



interface QueueTimelineProps {

  entries: QueueTimelineEntry[];

  orientation?: 'vertical' | 'horizontal';

  title?: string;

}



export function QueueTimeline({

  entries,

  orientation = 'vertical',

  title = 'Queue Timeline',

}: QueueTimelineProps) {

  const theme = useTheme();



  if (orientation === 'horizontal') {

    return (

      <Card style={styles.card}>

        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>

          {entries.map((entry, index) => (

            <Animated.View

              key={`${entry.ticketNumber}-${index}`}

              entering={FadeInRight.delay(index * 60).duration(350)}

              style={styles.hStep}

            >

              <View

                style={[

                  styles.hDot,

                  {

                    backgroundColor: entry.isYou

                      ? Colors.primary

                      : entry.isServing

                        ? Colors.secondary

                        : entry.isPast

                          ? Colors.secondary100

                          : theme.border,

                  },

                ]}

              >

                <Text

                  style={[

                    styles.hDotText,

                    {

                      color:

                        entry.isYou || entry.isServing ? Colors.textInverse : theme.textSecondary,

                    },

                  ]}

                >

                  {entry.ticketNumber.split('-')[1] ?? entry.ticketNumber}

                </Text>

              </View>

              <Text

                style={[

                  styles.hLabel,

                  {

                    color: entry.isYou ? Colors.primary : theme.textMuted,

                    fontFamily: entry.isYou

                      ? Typography.small.fontFamily

                      : Typography.caption.fontFamily,

                  },

                ]}

              >

                {entry.isYou ? 'YOU' : entry.isServing ? 'Now' : entry.ticketNumber}

              </Text>

              {index < entries.length - 1 ? (

                <View

                  style={[

                    styles.hLine,

                    {

                      backgroundColor:

                        entry.isPast || entry.isServing ? Colors.secondary : theme.border,

                    },

                  ]}

                />

              ) : null}

            </Animated.View>

          ))}

        </ScrollView>

      </Card>

    );

  }



  return (

    <Card style={styles.card}>

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      <View style={styles.vList}>

        <Text style={[styles.servingCaption, { color: theme.textMuted }]}>Currently Serving</Text>

        {entries.map((entry, index) => (

          <Animated.View

            key={`${entry.ticketNumber}-${index}`}

            entering={FadeInDown.delay(80 + index * 50).duration(350)}

            style={styles.vRow}

          >

            <View style={styles.vRail}>

              <View

                style={[

                  styles.vDot,

                  {

                    backgroundColor: entry.isYou

                      ? Colors.primary

                      : entry.isServing

                        ? Colors.secondary

                        : entry.isPast

                          ? Colors.secondary100

                          : theme.border,

                    borderColor: entry.isYou ? Colors.primary600 : 'transparent',

                    borderWidth: entry.isYou ? 2 : 0,

                  },

                ]}

              />

              {index < entries.length - 1 ? (

                <View

                  style={[

                    styles.vLine,

                    {

                      backgroundColor:

                        entry.isPast || entry.isServing ? Colors.secondary : theme.border,

                    },

                  ]}

                />

              ) : null}

            </View>

            <View

              style={[

                styles.vContent,

                entry.isYou && { backgroundColor: Colors.primary50, borderColor: Colors.primary100 },

                entry.isServing && !entry.isYou && { backgroundColor: Colors.secondary50 },

              ]}

            >

              <Text

                style={[

                  styles.vTicket,

                  {

                    color: entry.isYou

                      ? Colors.primary700

                      : entry.isServing

                        ? Colors.secondary600

                        : theme.text,

                  },

                ]}

              >

                {entry.isYou ? `YOU (${entry.ticketNumber})` : `Ticket ${entry.ticketNumber}`}

              </Text>

              {entry.isServing ? (

                <Text style={[styles.vMeta, { color: Colors.secondary600 }]}>Now serving</Text>

              ) : entry.isYou ? (

                <Text style={[styles.vMeta, { color: Colors.primary }]}>Your ticket</Text>

              ) : entry.isPast ? (

                <Text style={[styles.vMeta, { color: theme.textMuted }]}>Served</Text>

              ) : (

                <Text style={[styles.vMeta, { color: theme.textMuted }]}>Upcoming</Text>

              )}

            </View>

          </Animated.View>

        ))}

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

  servingCaption: {

    ...Typography.caption,

    marginBottom: Spacing.xs,

  },

  vList: {

    gap: 0,

  },

  vRow: {

    flexDirection: 'row',

    gap: Spacing.md,

    minHeight: 56,

  },

  vRail: {

    width: 20,

    alignItems: 'center',

  },

  vDot: {

    width: 14,

    height: 14,

    borderRadius: 7,

    marginTop: 14,

  },

  vLine: {

    flex: 1,

    width: 2,

    marginTop: 4,

    borderRadius: 1,

  },

  vContent: {

    flex: 1,

    borderRadius: Radius.lg,

    paddingVertical: Spacing.sm + 2,

    paddingHorizontal: Spacing.md,

    marginBottom: Spacing.sm,

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: 'transparent',

  },

  vTicket: {

    ...Typography.bodyMedium,

  },

  vMeta: {

    ...Typography.caption,

    marginTop: 2,

  },

  hRow: {

    alignItems: 'center',

    paddingVertical: Spacing.sm,

    gap: 0,

  },

  hStep: {

    alignItems: 'center',

    width: 64,

    position: 'relative',

  },

  hDot: {

    width: 40,

    height: 40,

    borderRadius: Radius.full,

    alignItems: 'center',

    justifyContent: 'center',

  },

  hDotText: {

    ...Typography.caption,

    fontFamily: Typography.small.fontFamily,

  },

  hLabel: {

    ...Typography.caption,

    marginTop: Spacing.xs,

    textAlign: 'center',

  },

  hLine: {

    position: 'absolute',

    top: 18,

    left: 52,

    width: 24,

    height: 3,

    borderRadius: 2,

  },

});

