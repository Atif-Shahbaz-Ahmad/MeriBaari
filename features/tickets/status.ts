import { Colors } from '@/constants/colors';

import type { QueueStatus } from '@/types';



export type TicketStatusMeta = {

  label: string;

  description: string;

  color: string;

  background: string;

  /** Lucide icon name key used by StatusBadge / screens */

  icon: 'clock' | 'bell' | 'sparkles' | 'check' | 'x' | 'alert';

};



export const TICKET_STATUS_META: Record<QueueStatus, TicketStatusMeta> = {

  waiting: {

    label: 'Waiting',

    description: 'You are in line. We’ll notify you as your turn approaches.',

    color: '#B45309',

    background: Colors.accent100,

    icon: 'clock',

  },

  almost: {

    label: 'Almost Your Turn',

    description: 'Stay nearby — you are next in a few minutes.',

    color: Colors.primary600,

    background: Colors.primary100,

    icon: 'bell',

  },

  called: {

    label: 'Called',

    description: 'Your number was called. Please proceed to the counter.',

    color: Colors.primary600,

    background: Colors.primary100,

    icon: 'bell',

  },

  serving: {

    label: 'Now Serving',

    description: 'It’s your turn. Head to the counter now.',

    color: Colors.secondary600,

    background: Colors.secondary100,

    icon: 'sparkles',

  },

  completed: {

    label: 'Completed',

    description: 'This queue visit is finished. Thanks for using MeriBaari.',

    color: Colors.secondary600,

    background: Colors.secondary50,

    icon: 'check',

  },

  cancelled: {

    label: 'Cancelled',

    description: 'This ticket was cancelled and is no longer active.',

    color: Colors.error,

    background: Colors.error100,

    icon: 'x',

  },

  missed: {

    label: 'Missed',

    description: 'Your turn was missed. Join the queue again if needed.',

    color: '#C2410C',

    background: Colors.accent50,

    icon: 'alert',

  },

  served: {

    label: 'Served',

    description: 'This queue visit is finished. Thanks for using MeriBaari.',

    color: Colors.secondary600,

    background: Colors.secondary50,

    icon: 'check',

  },

  skipped: {

    label: 'Skipped',

    description: 'This ticket was skipped by the business.',

    color: '#C2410C',

    background: Colors.accent50,

    icon: 'alert',

  },

};



export function getStatusMeta(status: QueueStatus): TicketStatusMeta {

  return TICKET_STATUS_META[status];

}

