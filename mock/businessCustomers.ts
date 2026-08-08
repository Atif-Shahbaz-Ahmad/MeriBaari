import type { BusinessPriority, BusinessWaitingCustomer } from '@/types';

/** Minutes ago helpers keep join times realistic relative to “now”. */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const MOCK_BUSINESS_CUSTOMERS: BusinessWaitingCustomer[] = [
  // General OPD
  {
    id: 'bc-a043',
    queueId: 'bq-general-opd',
    queueNumber: 'A-043',
    customerName: 'Ahmed Khan',
    phone: '+92 300 1112233',
    joinedAt: minutesAgo(28),
    estimatedServiceMinutes: 12,
    priority: 'normal',
    status: 'waiting',
  },
  {
    id: 'bc-a044',
    queueId: 'bq-general-opd',
    queueNumber: 'A-044',
    customerName: 'Sara Malik',
    phone: '+92 321 4455667',
    joinedAt: minutesAgo(24),
    estimatedServiceMinutes: 10,
    priority: 'priority',
    status: 'waiting',
  },
  {
    id: 'bc-a045',
    queueId: 'bq-general-opd',
    queueNumber: 'A-045',
    customerName: 'Hassan Ali',
    joinedAt: minutesAgo(21),
    estimatedServiceMinutes: 12,
    priority: 'normal',
    status: 'waiting',
  },
  {
    id: 'bc-a046',
    queueId: 'bq-general-opd',
    queueNumber: 'A-046',
    customerName: 'Fatima Noor',
    phone: '+92 333 9988776',
    joinedAt: minutesAgo(18),
    estimatedServiceMinutes: 8,
    priority: 'urgent',
    status: 'waiting',
  },
  {
    id: 'bc-a047',
    queueId: 'bq-general-opd',
    queueNumber: 'A-047',
    customerName: 'Bilal Siddiqui',
    joinedAt: minutesAgo(15),
    estimatedServiceMinutes: 12,
    priority: 'normal',
    status: 'waiting',
  },
  {
    id: 'bc-a048',
    queueId: 'bq-general-opd',
    queueNumber: 'A-048',
    customerName: 'Ayesha Raza',
    joinedAt: minutesAgo(11),
    estimatedServiceMinutes: 10,
    priority: 'normal',
    status: 'waiting',
  },
  // Lab
  {
    id: 'bc-l019',
    queueId: 'bq-lab',
    queueNumber: 'L-019',
    customerName: 'Usman Tariq',
    joinedAt: minutesAgo(16),
    estimatedServiceMinutes: 8,
    priority: 'normal',
    status: 'waiting',
  },
  {
    id: 'bc-l020',
    queueId: 'bq-lab',
    queueNumber: 'L-020',
    customerName: 'Nida Shah',
    phone: '+92 312 5566778',
    joinedAt: minutesAgo(12),
    estimatedServiceMinutes: 8,
    priority: 'priority',
    status: 'waiting',
  },
  {
    id: 'bc-l021',
    queueId: 'bq-lab',
    queueNumber: 'L-021',
    customerName: 'Omar Farooq',
    joinedAt: minutesAgo(9),
    estimatedServiceMinutes: 6,
    priority: 'normal',
    status: 'waiting',
  },
  // Cardiology
  {
    id: 'bc-c010',
    queueId: 'bq-cardio',
    queueNumber: 'C-010',
    customerName: 'Imran Bashir',
    joinedAt: minutesAgo(40),
    estimatedServiceMinutes: 20,
    priority: 'priority',
    status: 'waiting',
  },
  {
    id: 'bc-c011',
    queueId: 'bq-cardio',
    queueNumber: 'C-011',
    customerName: 'Zainab Hussain',
    phone: '+92 345 1122334',
    joinedAt: minutesAgo(32),
    estimatedServiceMinutes: 20,
    priority: 'normal',
    status: 'waiting',
  },
  // Pharmacy
  {
    id: 'bc-p062',
    queueId: 'bq-pharmacy',
    queueNumber: 'P-062',
    customerName: 'Kamran Iqbal',
    joinedAt: minutesAgo(7),
    estimatedServiceMinutes: 4,
    priority: 'normal',
    status: 'waiting',
  },
  {
    id: 'bc-p063',
    queueId: 'bq-pharmacy',
    queueNumber: 'P-063',
    customerName: 'Maryam Javed',
    joinedAt: minutesAgo(4),
    estimatedServiceMinutes: 4,
    priority: 'normal',
    status: 'waiting',
  },
];

export const WALK_IN_DEPARTMENTS = [
  { id: 'dept-ch-general', name: 'General OPD' },
  { id: 'dept-ch-lab', name: 'Laboratory' },
  { id: 'dept-ch-cardio', name: 'Cardiology' },
  { id: 'dept-ch-pharmacy', name: 'Pharmacy' },
] as const;

export const WALK_IN_SERVICES = [
  { id: 'svc-ch-gen-consult', departmentId: 'dept-ch-general', name: 'General Consultation', queueId: 'bq-general-opd' },
  { id: 'svc-ch-gen-followup', departmentId: 'dept-ch-general', name: 'Follow-up Visit', queueId: 'bq-general-opd' },
  { id: 'svc-ch-lab-blood', departmentId: 'dept-ch-lab', name: 'Blood Test', queueId: 'bq-lab' },
  { id: 'svc-ch-card-consult', departmentId: 'dept-ch-cardio', name: 'Cardiologist Consultation', queueId: 'bq-cardio' },
  { id: 'svc-ch-pharm-dispense', departmentId: 'dept-ch-pharmacy', name: 'Prescription Dispense', queueId: 'bq-pharmacy' },
] as const;

export const WALK_IN_PRIORITIES: { id: BusinessPriority; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'priority', label: 'Priority' },
  { id: 'urgent', label: 'Urgent' },
];

export function getCustomersByQueueId(
  queueId: string,
  customers: BusinessWaitingCustomer[] = MOCK_BUSINESS_CUSTOMERS,
): BusinessWaitingCustomer[] {
  return customers.filter((c) => c.queueId === queueId && c.status !== 'skipped');
}
