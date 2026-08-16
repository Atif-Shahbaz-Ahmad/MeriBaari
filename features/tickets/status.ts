import { LightTints, type SemanticTints } from '@/constants/colors';

import type { QueueStatus } from '@/types';

export type TicketStatusMeta = {
  label: string;
  description: string;
  color: string;
  background: string;
  /** Lucide icon name key used by StatusBadge / screens */
  icon: 'clock' | 'bell' | 'sparkles' | 'check' | 'x' | 'alert';
};

function buildStatusMeta(tints: SemanticTints): Record<QueueStatus, TicketStatusMeta> {
  return {
    waiting: {
      label: 'Waiting',
      description: 'You are in line. We’ll notify you as your turn approaches.',
      color: tints.accent.fg,
      background: tints.accent.bgStrong,
      icon: 'clock',
    },
    almost: {
      label: 'Almost Your Turn',
      description: 'Stay nearby — you are next in a few minutes.',
      color: tints.primary.fg,
      background: tints.primary.bgStrong,
      icon: 'bell',
    },
    called: {
      label: 'Called',
      description: 'Your number was called. Please proceed to the counter.',
      color: tints.primary.fg,
      background: tints.primary.bgStrong,
      icon: 'bell',
    },
    serving: {
      label: 'Now Serving',
      description: 'It’s your turn. Head to the counter now.',
      color: tints.secondary.fg,
      background: tints.secondary.bgStrong,
      icon: 'sparkles',
    },
    completed: {
      label: 'Completed',
      description: 'This queue visit is finished. Thanks for using MeriBaari.',
      color: tints.secondary.fg,
      background: tints.secondary.bg,
      icon: 'check',
    },
    cancelled: {
      label: 'Cancelled',
      description: 'This ticket was cancelled and is no longer active.',
      color: tints.error.fg,
      background: tints.error.bgStrong,
      icon: 'x',
    },
    missed: {
      label: 'Missed',
      description: 'Your turn was missed. Join the queue again if needed.',
      color: tints.accent.fg,
      background: tints.accent.bg,
      icon: 'alert',
    },
    served: {
      label: 'Served',
      description: 'This queue visit is finished. Thanks for using MeriBaari.',
      color: tints.secondary.fg,
      background: tints.secondary.bg,
      icon: 'check',
    },
    skipped: {
      label: 'Skipped',
      description: 'This ticket was skipped by the business.',
      color: tints.accent.fg,
      background: tints.accent.bg,
      icon: 'alert',
    },
  };
}

export const TICKET_STATUS_META: Record<QueueStatus, TicketStatusMeta> =
  buildStatusMeta(LightTints);

export function getStatusMeta(
  status: QueueStatus,
  tints: SemanticTints = LightTints,
): TicketStatusMeta {
  return buildStatusMeta(tints)[status];
}
