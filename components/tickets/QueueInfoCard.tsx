import { StyleSheet, Text, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';



import { Card } from '@/components/ui/Card';

import { Radius, Spacing } from '@/constants/spacing';

import { Typography } from '@/constants/typography';

import { useTheme } from '@/hooks/use-theme';



interface QueueInfoCardProps {

  title?: string;

  items: { label: string; value: string; accent?: 'primary' | 'secondary' | 'accent' }[];

}



export function QueueInfoCard({ title = 'Queue details', items }: QueueInfoCardProps) {

  const theme = useTheme();



  return (

    <Animated.View entering={FadeInDown.delay(100).duration(400)}>

      <Card style={styles.card}>

        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

        <View style={styles.grid}>

          {items.map((item) => (

            <View

              key={item.label}

              style={[styles.cell, { backgroundColor: theme.background, borderColor: theme.border }]}

            >

              <Text style={[styles.label, { color: theme.textMuted }]}>{item.label}</Text>

              <Text

                style={[

                  styles.value,

                  {

                    color:

                      item.accent === 'primary'

                        ? theme.primary

                        : item.accent === 'secondary'

                          ? theme.tints.secondary.fg

                          : item.accent === 'accent'

                            ? theme.tints.accent.fg

                            : theme.text,

                  },

                ]}

              >

                {item.value}

              </Text>

            </View>

          ))}

        </View>

      </Card>

    </Animated.View>

  );

}



const styles = StyleSheet.create({

  card: {

    gap: Spacing.md,

  },

  title: {

    ...Typography.h3,

  },

  grid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: Spacing.sm,

  },

  cell: {

    width: '48%',

    flexGrow: 1,

    borderRadius: Radius.lg,

    borderWidth: StyleSheet.hairlineWidth,

    padding: Spacing.md,

    gap: Spacing.xs,

  },

  label: {

    ...Typography.caption,

  },

  value: {

    ...Typography.h3,

  },

});

