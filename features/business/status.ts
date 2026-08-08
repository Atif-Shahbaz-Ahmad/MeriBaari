import { Colors } from '@/constants/colors';
import type { BusinessActivityType, BusinessPriority, BusinessQueueStatus } from '@/types';

export function getQueueStatusMeta(status: BusinessQueueStatus) {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        color: Colors.secondary600,
        background: Colors.secondary50,
        border: Colors.secondary100,
      };
    case 'paused':
      return {
        label: 'Paused',
        color: '#B45309',
        background: Colors.accent50,
        border: Colors.accent100,
      };
    case 'closed':
      return {
        label: 'Closed',
        color: Colors.error,
        background: Colors.error50,
        border: Colors.error100,
      };
    default:
      return {
        label: 'Unknown',
        color: Colors.textSecondary,
        background: Colors.borderLight,
        border: Colors.border,
      };
  }
}

export function getPriorityMeta(priority: BusinessPriority) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', color: Colors.error, background: Colors.error50 };
    case 'priority':
      return { label: 'Priority', color: '#B45309', background: Colors.accent50 };
    case 'normal':
    default:
      return { label: 'Normal', color: Colors.primary, background: Colors.primary50 };
  }
}

export function getActivityMeta(type: BusinessActivityType) {
  switch (type) {
    case 'called':
    case 'recalled':
      return { color: Colors.primary, background: Colors.primary50 };
    case 'completed':
    case 'resumed':
    case 'walk_in':
      return { color: Colors.secondary600, background: Colors.secondary50 };
    case 'skipped':
    case 'paused':
      return { color: '#B45309', background: Colors.accent50 };
    case 'cancelled':
      return { color: Colors.error, background: Colors.error50 };
    default:
      return { color: Colors.textSecondary, background: Colors.borderLight };
  }
}
