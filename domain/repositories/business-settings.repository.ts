import type { BusinessSettings, BusinessSettingsPayload } from '@/domain/models';
import type {
  BusinessActivityItem,
  BusinessDashboardStats,
  BusinessOrganizationSummary,
} from '@/types/business';
import type { ProfileStats } from '@/types/profile';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface BusinessProfileStats {
  activeQueues: number;
  customersServedToday: number;
  averageServiceMinutes: number;
  organizationName: string;
  membershipSince: string;
}

export interface BusinessSettingsRepository {
  getByOrganization(organizationId: string): Promise<BusinessSettings | null>;
  update(
    organizationId: string,
    settings: Partial<BusinessSettingsPayload>,
  ): Promise<BusinessSettings>;
  getDashboardStats(organizationId?: string): Promise<BusinessDashboardStats>;
  getOrganizationSummary(
    organizationId?: string,
  ): Promise<BusinessOrganizationSummary>;
  getCustomerProfileStats(): Promise<ProfileStats>;
  getBusinessProfileStats(): Promise<BusinessProfileStats>;
  listActivity(limit?: number): Promise<BusinessActivityItem[]>;
  listActivityByQueue(queueId: string): Promise<BusinessActivityItem[]>;
  subscribeSettings(
    organizationId: string,
    callback: SubscribeCallback<BusinessSettings>,
  ): Unsubscribe;
}
