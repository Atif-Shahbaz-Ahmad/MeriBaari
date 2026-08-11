import { useDepartment, useService } from '@/features/structure/hooks/use-structure-queries';
import { useOrganization } from '@/features/organization/hooks/use-organizations';
import { useJoinQueueStore } from '@/store/join-queue-store';

/** Resolves current Join Queue selection via organization/department/service queries. */
export function useJoinQueueSelection() {
  const organizationId = useJoinQueueStore((s) => s.organizationId);
  const departmentId = useJoinQueueStore((s) => s.departmentId);
  const serviceId = useJoinQueueStore((s) => s.serviceId);

  const { data: organization } = useOrganization(organizationId ?? undefined);
  const { data: department } = useDepartment(departmentId ?? undefined);
  const { data: service } = useService(serviceId ?? undefined);

  const activeDepartment = department?.isActive ? department : undefined;
  const activeService = service?.isActive ? service : undefined;

  return {
    organizationId,
    departmentId,
    serviceId,
    organization: organization ?? undefined,
    department: activeDepartment,
    service: activeService,
    isComplete: Boolean(organization && activeDepartment && activeService),
  };
}
