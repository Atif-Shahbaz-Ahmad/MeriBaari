import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import { historyQueryKeys } from '@/features/history/query-keys';
import type { TicketHistoryListParams } from '@/domain/repositories';

const PAGE_SIZE = 40;

export function useCustomerHistory(options?: TicketHistoryListParams) {
  const limit = options?.limit ?? PAGE_SIZE;
  const offset = options?.offset ?? 0;

  return useQuery({
    queryKey: historyQueryKeys.customer({ limit, offset }),
    queryFn: () =>
      getContainer().ticketService.listMyHistory({ limit, offset }),
  });
}
