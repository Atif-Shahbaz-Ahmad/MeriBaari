import type { BusinessQueue, BusinessQueueDetailsStats } from '@/types';

export const MOCK_BUSINESS_QUEUES: BusinessQueue[] = [
  {
    id: 'bq-general-opd',
    name: 'General OPD',
    departmentId: 'dept-ch-general',
    departmentName: 'General OPD',
    serviceId: 'svc-ch-gen-consult',
    serviceName: 'General Consultation',
    status: 'active',
    currentServing: 'A-042',
    nextNumber: 'A-043',
    waitingCount: 11,
    estimatedWaitMinutes: 22,
    averageWaitMinutes: 14,
    prefix: 'A',
  },
  {
    id: 'bq-lab',
    name: 'Lab — Blood Test',
    departmentId: 'dept-ch-lab',
    departmentName: 'Laboratory',
    serviceId: 'svc-ch-lab-blood',
    serviceName: 'Blood Test',
    status: 'active',
    currentServing: 'L-018',
    nextNumber: 'L-019',
    waitingCount: 7,
    estimatedWaitMinutes: 12,
    averageWaitMinutes: 8,
    prefix: 'L',
  },
  {
    id: 'bq-cardio',
    name: 'Cardiology',
    departmentId: 'dept-ch-cardio',
    departmentName: 'Cardiology',
    serviceId: 'svc-ch-card-consult',
    serviceName: 'Cardiologist Consultation',
    status: 'paused',
    currentServing: 'C-009',
    nextNumber: 'C-010',
    waitingCount: 5,
    estimatedWaitMinutes: 35,
    averageWaitMinutes: 28,
    prefix: 'C',
  },
  {
    id: 'bq-pharmacy',
    name: 'Pharmacy Counter',
    departmentId: 'dept-ch-pharmacy',
    departmentName: 'Pharmacy',
    serviceId: 'svc-ch-pharm-dispense',
    serviceName: 'Prescription Dispense',
    status: 'active',
    currentServing: 'P-061',
    nextNumber: 'P-062',
    waitingCount: 4,
    estimatedWaitMinutes: 8,
    averageWaitMinutes: 6,
    prefix: 'P',
  },
];

export const MOCK_BUSINESS_QUEUE_DETAILS: Record<string, BusinessQueueDetailsStats> = {
  'bq-general-opd': {
    queueId: 'bq-general-opd',
    totalWaiting: 11,
    completedToday: 48,
    cancelledToday: 3,
    averageServiceMinutes: 12,
    queueSpeed: 5,
  },
  'bq-lab': {
    queueId: 'bq-lab',
    totalWaiting: 7,
    completedToday: 36,
    cancelledToday: 1,
    averageServiceMinutes: 8,
    queueSpeed: 7,
  },
  'bq-cardio': {
    queueId: 'bq-cardio',
    totalWaiting: 5,
    completedToday: 14,
    cancelledToday: 2,
    averageServiceMinutes: 20,
    queueSpeed: 3,
  },
  'bq-pharmacy': {
    queueId: 'bq-pharmacy',
    totalWaiting: 4,
    completedToday: 62,
    cancelledToday: 0,
    averageServiceMinutes: 4,
    queueSpeed: 12,
  },
};

export function getBusinessQueueById(id: string): BusinessQueue | undefined {
  return MOCK_BUSINESS_QUEUES.find((q) => q.id === id);
}

export function getBusinessQueueDetails(id: string): BusinessQueueDetailsStats | undefined {
  return MOCK_BUSINESS_QUEUE_DETAILS[id];
}

export function getActiveBusinessQueues(queues: BusinessQueue[] = MOCK_BUSINESS_QUEUES): BusinessQueue[] {
  return queues.filter((q) => q.status !== 'closed');
}
