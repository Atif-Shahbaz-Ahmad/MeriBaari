import { dataAccess } from '@/data';
import { useJoinQueueStore } from '@/store/join-queue-store';

/** Resolves current Join Queue selection via the data layer. */
export function useJoinQueueSelection() {
  const organizationId = useJoinQueueStore((s) => s.organizationId);
  const departmentId = useJoinQueueStore((s) => s.departmentId);
  const serviceId = useJoinQueueStore((s) => s.serviceId);

  const organization = organizationId
    ? dataAccess.getOrganizationById(organizationId)
    : undefined;
  const department = departmentId
    ? dataAccess.getDepartmentById(departmentId)
    : undefined;
  const service = serviceId ? dataAccess.getServiceById(serviceId) : undefined;

  return {
    organizationId,
    departmentId,
    serviceId,
    organization,
    department,
    service,
    isComplete: Boolean(organization && department && service),
  };
}
