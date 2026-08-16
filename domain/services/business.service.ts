import type { BusinessSettingsRepository } from '@/domain/repositories';
import type { QueueRepository } from '@/domain/repositories';
import type { QueueEntryRepository } from '@/domain/repositories';
import type { CatalogRepository } from '@/domain/repositories';
import type { WalkInDraft, WalkInResult } from '@/types/business';
import {
  formatBusinessDate,
  getBusinessGreeting,
} from '@/mock/businessDashboard';

/**
 * Business operations: dashboard, walk-ins, and org settings.
 */
export class BusinessService {
  constructor(
    private readonly settings: BusinessSettingsRepository,
    private readonly queues: QueueRepository,
    private readonly entries: QueueEntryRepository,
    private readonly catalog: CatalogRepository,
  ) {}

  getDashboardStats(organizationId?: string) {
    return this.settings.getDashboardStats(organizationId);
  }

  getOrganizationSummary(organizationId?: string) {
    return this.settings.getOrganizationSummary(organizationId);
  }

  getCustomerProfileStats() {
    return this.settings.getCustomerProfileStats();
  }

  getBusinessProfileStats() {
    return this.settings.getBusinessProfileStats();
  }

  listActivity(limit?: number) {
    return this.settings.listActivity(limit);
  }

  listActivityByQueue(queueId: string) {
    return this.settings.listActivityByQueue(queueId);
  }

  getBusinessQueueDetails(queueId: string) {
    return this.queues.getBusinessQueueDetails(queueId);
  }

  listBusinessQueues() {
    return this.queues.listBusinessQueues();
  }

  getWalkInDepartments() {
    return this.catalog.getWalkInDepartments();
  }

  getWalkInServices() {
    return this.catalog.getWalkInServices();
  }

  getWalkInPriorities() {
    return this.catalog.getWalkInPriorities();
  }

  async createWalkIn(draft: WalkInDraft): Promise<WalkInResult> {
    const [departments, services, queues] = await Promise.all([
      this.catalog.getWalkInDepartments(),
      this.catalog.getWalkInServices(),
      this.queues.listBusinessQueues(),
    ]);

    const service = services.find((s) => s.id === draft.serviceId);
    const department = departments.find((d) => d.id === draft.departmentId);
    const queueId = service?.queueId ?? queues[0]?.id;
    const queue = queues.find((q) => q.id === queueId) ?? queues[0];

    if (!queue) {
      throw new Error('No queue available for walk-in');
    }

    const customer = await this.entries.createWalkIn(draft);

    return {
      ticketNumber: customer.queueNumber,
      queueId: queue.id,
      queueName: queue.name,
      departmentName:
        draft.departmentName?.trim() ||
        department?.name ||
        queue.departmentName,
      serviceName:
        draft.serviceName?.trim() || service?.name || queue.serviceName,
      estimatedWaitMinutes: queue.estimatedWaitMinutes,
      position: queue.waitingCount + 1,
    };
  }

  getGreeting(date?: Date) {
    return getBusinessGreeting(date);
  }

  formatDate(date?: Date) {
    return formatBusinessDate(date);
  }
}
