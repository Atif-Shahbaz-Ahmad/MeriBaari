import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import {
  departmentQueryKeys,
  serviceQueryKeys,
} from '@/features/structure/query-keys';
import { useAuthStore } from '@/store/auth-store';

export function useDepartments(
  organizationId: string | undefined,
  options?: { activeOnly?: boolean; enabled?: boolean },
) {
  const userId = useAuthStore((s) => s.user?.id);
  const activeOnly = options?.activeOnly ?? false;

  return useQuery({
    queryKey: departmentQueryKeys.list(organizationId ?? '', activeOnly),
    queryFn: () => {
      if (!organizationId) return [];
      return getContainer().departmentService.getDepartmentsByOrganization(
        organizationId,
        { activeOnly },
      );
    },
    enabled: Boolean(options?.enabled !== false && userId && organizationId),
  });
}

export function useDepartment(id: string | undefined, enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: departmentQueryKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) return null;
      return getContainer().departmentService.getDepartmentById(id);
    },
    enabled: Boolean(enabled && userId && id),
  });
}

export function useServices(
  departmentId: string | undefined,
  options?: { activeOnly?: boolean; enabled?: boolean },
) {
  const userId = useAuthStore((s) => s.user?.id);
  const activeOnly = options?.activeOnly ?? false;

  return useQuery({
    queryKey: serviceQueryKeys.list(departmentId ?? '', activeOnly),
    queryFn: () => {
      if (!departmentId) return [];
      return getContainer().serviceService.getServicesByDepartment(departmentId, {
        activeOnly,
      });
    },
    enabled: Boolean(options?.enabled !== false && userId && departmentId),
  });
}

export function useService(id: string | undefined, enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: serviceQueryKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) return null;
      return getContainer().serviceService.getServiceById(id);
    },
    enabled: Boolean(enabled && userId && id),
  });
}
