import type { BusinessSettings, BusinessSettingsPayload } from '@/domain/models';
import type {
  BusinessProfileStats,
  BusinessSettingsRepository,
} from '@/domain/repositories';
import type {
  BusinessActivityItem,
  BusinessDashboardStats,
  BusinessOrganizationSummary,
} from '@/types/business';
import type { ProfileStats } from '@/types/profile';
import {
  getActivityByQueueId,
  getRecentActivity,
  MOCK_BUSINESS_ACTIVITY,
} from '@/mock/businessActivity';
import {
  MOCK_BUSINESS_DASHBOARD_STATS,
  MOCK_BUSINESS_ORG,
} from '@/mock/businessDashboard';
import {
  MOCK_BUSINESS_PROFILE_STATS,
  MOCK_PROFILE_STATS,
} from '@/mock/profile';
import { noopSubscribe } from './noop-subscribe';

const DEFAULT_ORG_ID = 'org-city-hospital';

export class MockBusinessSettingsRepository
  implements BusinessSettingsRepository
{
  private settings = new Map<string, BusinessSettings>([
    [
      DEFAULT_ORG_ID,
      {
        id: 'bs-city-hospital',
        organizationId: DEFAULT_ORG_ID,
        settings: {
          autoCallNext: true,
          allowWalkIns: true,
          defaultPriority: 'normal',
          notifyOnJoin: true,
          estimatedWaitVisible: true,
          soundEnabled: true,
        },
        updatedAt: '2025-08-01T00:00:00.000Z',
      },
    ],
  ]);

  private activity: BusinessActivityItem[] = MOCK_BUSINESS_ACTIVITY.map((a) => ({
    ...a,
  }));

  async getByOrganization(
    organizationId: string,
  ): Promise<BusinessSettings | null> {
    return this.settings.get(organizationId) ?? null;
  }

  async update(
    organizationId: string,
    settings: Partial<BusinessSettingsPayload>,
  ): Promise<BusinessSettings> {
    const existing = this.settings.get(organizationId) ?? {
      id: `bs-${organizationId}`,
      organizationId,
      settings: {},
    };
    const updated: BusinessSettings = {
      ...existing,
      settings: { ...existing.settings, ...settings },
      updatedAt: new Date().toISOString(),
    };
    this.settings.set(organizationId, updated);
    return updated;
  }

  async getDashboardStats(
    _organizationId?: string,
  ): Promise<BusinessDashboardStats> {
    return { ...MOCK_BUSINESS_DASHBOARD_STATS };
  }

  async getOrganizationSummary(
    _organizationId?: string,
  ): Promise<BusinessOrganizationSummary> {
    return { ...MOCK_BUSINESS_ORG };
  }

  async getCustomerProfileStats(): Promise<ProfileStats> {
    return { ...MOCK_PROFILE_STATS };
  }

  async getBusinessProfileStats(): Promise<BusinessProfileStats> {
    return { ...MOCK_BUSINESS_PROFILE_STATS };
  }

  async listActivity(limit = 20): Promise<BusinessActivityItem[]> {
    return getRecentActivity(limit, this.activity);
  }

  async listActivityByQueue(queueId: string): Promise<BusinessActivityItem[]> {
    return getActivityByQueueId(queueId, this.activity);
  }

  subscribeSettings(
    organizationId: string,
    callback: (payload: BusinessSettings) => void,
  ) {
    return noopSubscribe(callback);
  }

  /** Seed helpers for business queue store hydration. */
  getSeedActivity(): BusinessActivityItem[] {
    return this.activity.map((a) => ({ ...a }));
  }

  pushActivity(item: BusinessActivityItem): void {
    this.activity = [item, ...this.activity];
  }
}
