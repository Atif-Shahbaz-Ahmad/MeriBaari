import { StyleSheet, Text, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { QrCode } from 'lucide-react-native';



import { Colors } from '@/constants/colors';

import { Radius, Spacing } from '@/constants/spacing';

import { Typography } from '@/constants/typography';

import { useTheme } from '@/hooks/use-theme';



interface QRPlaceholderProps {

  ticketNumber?: string;

  queueId?: string;

  size?: number;

}



export function QRPlaceholder({ ticketNumber, queueId, size = 148 }: QRPlaceholderProps) {

  const theme = useTheme();



  return (

    <Animated.View

      entering={FadeInDown.delay(180).duration(450)}

      style={[

        styles.box,

        {

          width: size,

          height: size,

          borderColor: theme.border,

          backgroundColor: theme.background,

        },

      ]}

    >

      <View style={[styles.inner, { backgroundColor: Colors.primary50 }]}>

        <QrCode size={size * 0.48} color={Colors.primary} strokeWidth={1.5} />

      </View>

      {ticketNumber ? (

        <Text style={[styles.meta, { color: theme.textMuted }]}>{ticketNumber}</Text>

      ) : null}

      {queueId ? (

        <Text style={[styles.queueId, { color: theme.textMuted }]} numberOfLines={1}>

          {queueId}

        </Text>

      ) : null}

    </Animated.View>

  );

}



const styles = StyleSheet.create({

  box: {

    borderWidth: 1.5,

    borderStyle: 'dashed',

    borderRadius: Radius.xl,

    alignItems: 'center',

    justifyContent: 'center',

    gap: Spacing.sm,

    padding: Spacing.md,

    alignSelf: 'center',

  },

  inner: {

    width: '72%',

    aspectRatio: 1,

    borderRadius: Radius.lg,

    alignItems: 'center',

    justifyContent: 'center',

  },

  meta: {

    ...Typography.small,

  },

  queueId: {

    ...Typography.caption,

    maxWidth: '100%',

  },

});

