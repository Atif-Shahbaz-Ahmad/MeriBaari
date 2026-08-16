import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { BellRing } from 'lucide-react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';



import { Colors } from '@/constants/colors';

import { Radius, Spacing } from '@/constants/spacing';

import { Typography } from '@/constants/typography';

import { useTheme } from '@/hooks/use-theme';



interface ReminderToggleProps {

  enabled: boolean;

  onValueChange: (value: boolean) => void;

}



export function ReminderToggle({ enabled, onValueChange }: ReminderToggleProps) {

  const theme = useTheme();



  return (

    <Animated.View entering={FadeInDown.delay(220).duration(400)}>

      <Pressable

        onPress={() => onValueChange(!enabled)}

        style={[

          styles.row,

          {

            backgroundColor: theme.card,

            borderColor: theme.border,

          },

        ]}

        accessibilityRole="switch"

        accessibilityState={{ checked: enabled }}

      >

        <View style={[styles.icon, { backgroundColor: theme.tints.primary.bg }]}>

          <BellRing size={18} color={Colors.primary} strokeWidth={2} />

        </View>

        <View style={styles.copy}>

          <Text style={[styles.title, { color: theme.text }]}>Turn reminders</Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>

            Get notified when your turn is approaching

          </Text>

        </View>

        <Switch

          value={enabled}

          onValueChange={onValueChange}

          trackColor={{ false: theme.border, true: theme.tints.primary.bgStrong }}

          thumbColor={enabled ? Colors.primary : '#f4f4f5'}

        />

      </Pressable>

    </Animated.View>

  );

}



const styles = StyleSheet.create({

  row: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: Spacing.md,

    padding: Spacing.md,

    borderRadius: Radius.xl,

    borderWidth: StyleSheet.hairlineWidth,

  },

  icon: {

    width: 40,

    height: 40,

    borderRadius: Radius.md,

    alignItems: 'center',

    justifyContent: 'center',

  },

  copy: {

    flex: 1,

    gap: 2,

  },

  title: {

    ...Typography.bodyMedium,

  },

  subtitle: {

    ...Typography.caption,

  },

});

