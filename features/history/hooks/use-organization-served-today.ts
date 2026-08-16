import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import { historyQueryKeys } from '@/features/history/query-keys';

export function useOrganizationServedToday(organizationId: string | undefined) {
  return useQuery({
    queryKey: historyQueryKeys.servedToday(organizationId ?? ''),
    queryFn: () =>
      getContainer().ticketService.countOrganizationServedToday(organizationId!),
    enabled: Boolean(organizationId),
  });
}
