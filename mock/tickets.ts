import type { QueueTicket } from '@/types';



const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

const hoursAgo = (h: number) => minutesAgo(h * 60);

const daysAgo = (d: number) => minutesAgo(d * 24 * 60);



/** Seed active + historical tickets for the Ticket Experience. */

export const MOCK_TICKETS: QueueTicket[] = [

  {

    id: 'ticket-1',

    ticketNumber: 'A-127',

    queueId: 'queue-ch-gen-opd',

    organizationId: 'org-city-hospital',

    locationName: 'City Hospital',

    organizationName: 'City Hospital',

    departmentId: 'dept-ch-general',

    departmentName: 'General Medicine',

    serviceId: 'svc-ch-gen-consult',

    serviceName: 'General OPD Consultation',

    status: 'waiting',

    position: 4,

    peopleAhead: 3,

    estimatedWaitMinutes: 12,

    currentServing: 'A-124',

    counter: '03',

    joinedAt: minutesAgo(18),

    estimatedCompletionAt: minutesFromNow(12),

    reminderEnabled: true,

    logoIcon: 'hospital',

  },

  {

    id: 'ticket-2',

    ticketNumber: 'B-058',

    queueId: 'queue-hbl-teller',

    organizationId: 'org-hbl',

    locationName: 'HBL Jail Road',

    organizationName: 'HBL Jail Road Branch',

    departmentId: 'dept-hbl-customer',

    departmentName: 'Customer Services',

    serviceId: 'svc-hbl-general',

    serviceName: 'General Banking',

    status: 'almost',

    position: 2,

    peopleAhead: 1,

    estimatedWaitMinutes: 4,

    currentServing: 'B-057',

    counter: '02',

    joinedAt: minutesAgo(22),

    estimatedCompletionAt: minutesFromNow(4),

    reminderEnabled: true,

    logoIcon: 'bank',

  },

  {

    id: 'ticket-3',

    ticketNumber: 'C-214',

    queueId: 'queue-nadra-cnic',

    organizationId: 'org-nadra',

    locationName: 'NADRA Center',

    organizationName: 'NADRA Registration Center',

    departmentId: 'dept-nadra-cnic',

    departmentName: 'CNIC Services',

    serviceId: 'svc-nadra-cnic',

    serviceName: 'CNIC Renewal',

    status: 'serving',

    position: 1,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'C-214',

    counter: '01',

    joinedAt: minutesAgo(45),

    estimatedCompletionAt: minutesFromNow(8),

    reminderEnabled: false,

    logoIcon: 'landmark',

  },

  {

    id: 'ticket-4',

    ticketNumber: 'D-091',

    queueId: 'queue-pic-opd',

    organizationId: 'org-pic',

    locationName: 'Punjab Institute of Cardiology',

    organizationName: 'Punjab Institute of Cardiology',

    departmentId: 'dept-pic-opd',

    departmentName: 'Cardiology OPD',

    serviceId: 'svc-pic-card-opd',

    serviceName: 'Cardiology Consultation',

    status: 'completed',

    position: 0,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'D-092',

    counter: '05',

    joinedAt: hoursAgo(5),

    completedAt: hoursAgo(4),

    actualWaitMinutes: 28,

    reminderEnabled: false,

    logoIcon: 'hospital',

  },

  {

    id: 'ticket-5',

    ticketNumber: 'E-033',

    queueId: 'queue-passport-fresh',

    organizationId: 'org-passport',

    locationName: 'Passport Office Lahore',

    organizationName: 'Regional Passport Office — Lahore',

    departmentId: 'dept-pass-issuance',

    departmentName: 'Passport Issuance',

    serviceId: 'svc-pass-new',

    serviceName: 'Fresh Passport Application',

    status: 'completed',

    position: 0,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'E-040',

    counter: '04',

    joinedAt: daysAgo(1),

    completedAt: daysAgo(1),

    actualWaitMinutes: 52,

    reminderEnabled: false,

    logoIcon: 'building',

  },

  {

    id: 'ticket-6',

    ticketNumber: 'F-012',

    queueId: 'queue-sk-onc',

    organizationId: 'org-shaukat-khanum',

    locationName: 'Shaukat Khanum',

    organizationName: 'Shaukat Khanum Memorial Cancer Hospital',

    departmentId: 'dept-sk-oncology',

    departmentName: 'Oncology',

    serviceId: 'svc-sk-onc-consult',

    serviceName: 'Oncology Consultation',

    status: 'cancelled',

    position: 0,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'F-008',

    counter: '02',

    joinedAt: daysAgo(2),

    cancelledAt: daysAgo(2),

    reminderEnabled: false,

    logoIcon: 'hospital',

  },

  {

    id: 'ticket-7',

    ticketNumber: 'G-077',

    queueId: 'queue-chughtai-lab',

    organizationId: 'org-chughtai',

    locationName: 'Chughtai Lab',

    organizationName: 'Chughtai Lab',

    departmentId: 'dept-cl-collection',

    departmentName: 'Sample Collection',

    serviceId: 'svc-cl-blood',

    serviceName: 'Blood Test',

    status: 'missed',

    position: 0,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'G-080',

    counter: '01',

    joinedAt: daysAgo(3),

    cancelledAt: daysAgo(3),

    reminderEnabled: false,

    logoIcon: 'clinic',

  },

  {

    id: 'ticket-8',

    ticketNumber: 'H-156',

    queueId: 'queue-meezan-acc',

    organizationId: 'org-meezan',

    locationName: 'Meezan Bank',

    organizationName: 'Meezan Bank',

    departmentId: 'dept-mz-customer',

    departmentName: 'Customer Services',

    serviceId: 'svc-mz-account',

    serviceName: 'Account Opening',

    status: 'completed',

    position: 0,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'H-160',

    counter: '03',

    joinedAt: daysAgo(5),

    completedAt: daysAgo(5),

    actualWaitMinutes: 35,

    reminderEnabled: false,

    logoIcon: 'bank',

  },

  {

    id: 'ticket-9',

    ticketNumber: 'I-041',

    queueId: 'queue-ucp-admin',

    organizationId: 'org-ucp',

    locationName: 'UCP',

    organizationName: 'University of Central Punjab',

    departmentId: 'dept-ucp-records',

    departmentName: 'Student Records',

    serviceId: 'svc-ucp-transcript',

    serviceName: 'Transcript Request',

    status: 'completed',

    position: 0,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'I-045',

    counter: '02',

    joinedAt: daysAgo(8),

    completedAt: daysAgo(8),

    actualWaitMinutes: 18,

    reminderEnabled: false,

    logoIcon: 'university',

  },

  {

    id: 'ticket-10',

    ticketNumber: 'J-009',

    queueId: 'queue-excise-vehicle',

    organizationId: 'org-excise',

    locationName: 'Excise & Taxation',

    organizationName: 'Excise & Taxation Department — Lahore',

    departmentId: 'dept-excise-vehicle',

    departmentName: 'Vehicle Registration',

    serviceId: 'svc-excise-vehicle',

    serviceName: 'Token Tax Payment',

    status: 'cancelled',

    position: 0,

    peopleAhead: 0,

    estimatedWaitMinutes: 0,

    currentServing: 'J-005',

    counter: '06',

    joinedAt: daysAgo(10),

    cancelledAt: daysAgo(10),

    reminderEnabled: false,

    logoIcon: 'car',

  },

];



export function getTicketById(id: string): QueueTicket | undefined {

  return MOCK_TICKETS.find((t) => t.id === id);

}



export function getActiveTickets(tickets: QueueTicket[] = MOCK_TICKETS): QueueTicket[] {

  return tickets.filter((t) => isActiveStatus(t.status));

}



export function getCompletedTickets(tickets: QueueTicket[] = MOCK_TICKETS): QueueTicket[] {

  return tickets.filter((t) => t.status === 'completed');

}



export function getCancelledTickets(tickets: QueueTicket[] = MOCK_TICKETS): QueueTicket[] {

  return tickets.filter((t) => t.status === 'cancelled' || t.status === 'missed');

}



export function isActiveStatus(status: QueueTicket['status']): boolean {

  return status === 'waiting' || status === 'almost' || status === 'serving' || status === 'called';

}



/** Primary active ticket for Home dashboard. */

export function getPrimaryActiveTicket(tickets: QueueTicket[] = MOCK_TICKETS): QueueTicket | undefined {

  const active = getActiveTickets(tickets);

  const serving = active.find((t) => t.status === 'serving');

  if (serving) return serving;

  const almost = active.find((t) => t.status === 'almost' || t.status === 'called');

  if (almost) return almost;

  return active[0];

}

