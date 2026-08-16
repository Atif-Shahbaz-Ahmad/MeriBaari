import { LightTints, type SemanticTints } from '@/constants/colors';
import type { BusinessActivityType, BusinessPriority, BusinessQueueStatus } from '@/types';

export function getQueueStatusMeta(
  status: BusinessQueueStatus,
  tints: SemanticTints = LightTints,
) {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        color: tints.secondary.fg,
        background: tints.secondary.bg,
        border: tints.secondary.border,
      };
    case 'paused':
      return {
        label: 'Paused',
        color: tints.accent.fg,
        background: tints.accent.bg,
        border: tints.accent.border,
      };
    case 'closed':
      return {
        label: 'Closed',
        color: tints.error.fg,
        background: tints.error.bg,
        border: tints.error.border,
      };
    default:
      return {
        label: 'Unknown',
        color: tints.muted.fg,
        background: tints.muted.bg,
        border: tints.muted.border,
      };
  }
}

export function getPriorityMeta(
  priority: BusinessPriority,
  tints: SemanticTints = LightTints,
) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', color: tints.error.fg, background: tints.error.bg };
    case 'priority':
      return { label: 'Priority', color: tints.accent.fg, background: tints.accent.bg };
    case 'normal':
    default:
      return { label: 'Normal', color: tints.primary.fg, background: tints.primary.bg };
  }
}

export function getActivityMeta(
  type: BusinessActivityType,
  tints: SemanticTints = LightTints,
) {
  switch (type) {
    case 'called':
    case 'recalled':
      return { color: tints.primary.fg, background: tints.primary.bg };
    case 'completed':
    case 'resumed':
    case 'walk_in':
      return { color: tints.secondary.fg, background: tints.secondary.bg };
    case 'skipped':
    case 'paused':
      return { color: tints.accent.fg, background: tints.accent.bg };
    case 'cancelled':
      return { color: tints.error.fg, background: tints.error.bg };
    default:
      return { color: tints.muted.fg, background: tints.muted.bg };
  }
}
