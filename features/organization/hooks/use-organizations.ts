import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import { organizationQueryKeys } from '@/features/organization/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { OrganizationCategory } from '@/types/organization';

export function useMyOrganization(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.role);

  return useQuery({
    queryKey: organizationQueryKeys.mine,
    queryFn: () => getContainer().organizationService.getMyOrganization(),
    enabled: Boolean(enabled && userId && role === 'business'),
  });
}

export function useOrganizations(
  query = '',
  category: OrganizationCategory | 'all' = 'all',
  enabled = true,
) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: organizationQueryKeys.list(query.trim(), category),
    queryFn: () =>
      getContainer().organizationService.search(query.trim(), category),
    enabled: Boolean(enabled && userId),
  });
}

export function useOrganization(id: string | undefined, enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: organizationQueryKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) return null;
      return getContainer().organizationService.getOrganizationById(id);
    },
    enabled: Boolean(enabled && userId && id),
  });
}
