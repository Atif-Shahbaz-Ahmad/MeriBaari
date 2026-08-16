import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import { historyQueryKeys } from '@/features/history/query-keys';
import { EMPTY_TICKET_STATISTICS } from '@/mock/statistics';

export function useMyTicketStatistics(enabled = true) {
  return useQuery({
    queryKey: historyQueryKeys.myStatistics(),
    queryFn: () => getContainer().ticketService.getStatistics(),
    enabled,
    placeholderData: EMPTY_TICKET_STATISTICS,
  });
}
