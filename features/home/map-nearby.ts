import { getOrganizationCategoryIcon } from '@/constants/organization-categories';import type { Organization } from '@/domain/models';
import type { NearbyService } from '@/types';

export function mapOrganizationToNearbyService(
  org: Organization,
): NearbyService {
  return {
    id: org.id,
    name: org.name,
    category: org.category,
    icon: org.logoIcon ?? getOrganizationCategoryIcon(org.category),
    averageWaitMinutes: org.averageWaitMinutes,
    distanceKm: org.distanceKm > 0 ? org.distanceKm : undefined,
  };
}
