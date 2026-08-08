import { StyleSheet, Text, View } from 'react-native';

import {

  AlertTriangle,

  Bell,

  Check,

  Clock3,

  Sparkles,

  X,

} from 'lucide-react-native';



import { getStatusMeta } from '@/features/tickets/status';

import { Radius, Spacing } from '@/constants/spacing';

import { Typography } from '@/constants/typography';

import { Colors } from '@/constants/colors';

import type { QueueStatus } from '@/types';



type BadgeStatus = QueueStatus | 'live' | 'current';



const EXTRA: Record<'live' | 'current', { label: string; background: string; color: string }> = {

  live: { label: 'Live', background: Colors.secondary100, color: Colors.secondary600 },

  current: { label: 'Current', background: Colors.secondary100, color: Colors.secondary600 },

};



interface StatusBadgeProps {

  status: BadgeStatus;

  label?: string;

  showIcon?: boolean;

  size?: 'sm' | 'md';

}



export function StatusBadge({ status, label, showIcon = false, size = 'sm' }: StatusBadgeProps) {

  const config =

    status === 'live' || status === 'current'

      ? EXTRA[status]

      : {

          label: getStatusMeta(status).label,

          background: getStatusMeta(status).background,

          color: getStatusMeta(status).color,

        };



  const meta = status !== 'live' && status !== 'current' ? getStatusMeta(status) : null;



  return (

    <View

      style={[

        styles.badge,

        size === 'md' && styles.badgeMd,

        { backgroundColor: config.background },

      ]}

    >

      {showIcon && meta ? (

        <StatusIcon name={meta.icon} color={config.color} />

      ) : (

        <View style={[styles.dot, { backgroundColor: config.color }]} />

      )}

      <Text style={[styles.label, size === 'md' && styles.labelMd, { color: config.color }]}>

        {label ?? config.label}

      </Text>

    </View>

  );

}



function StatusIcon({

  name,

  color,

}: {

  name: 'clock' | 'bell' | 'sparkles' | 'check' | 'x' | 'alert';

  color: string;

}) {

  const props = { size: 12, color, strokeWidth: 2.25 } as const;

  switch (name) {

    case 'clock':

      return <Clock3 {...props} />;

    case 'bell':

      return <Bell {...props} />;

    case 'sparkles':

      return <Sparkles {...props} />;

    case 'check':

      return <Check {...props} />;

    case 'x':

      return <X {...props} />;

    case 'alert':

      return <AlertTriangle {...props} />;

    default:

      return null;

  }

}



const styles = StyleSheet.create({

  badge: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: Spacing.xs + 2,

    paddingHorizontal: Spacing.sm + 2,

    paddingVertical: Spacing.xs + 2,

    borderRadius: Radius.full,

  },

  badgeMd: {

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm,

    gap: Spacing.sm,

  },

  dot: {

    width: 6,

    height: 6,

    borderRadius: 3,

  },

  label: {

    ...Typography.caption,

    fontFamily: Typography.small.fontFamily,

  },

  labelMd: {

    ...Typography.small,

  },

});

