import { BusinessHref, pushOwnerHistory } from '@/features/business/navigation';

/** Owner ticket history route helpers. */
export const HistoryHref = {
  owner: BusinessHref.history,
} as const;

export { pushOwnerHistory };
