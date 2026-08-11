export const queueQueryKeys = {
  all: ['queues'] as const,
  lists: ['queues', 'list'] as const,
  organization: (organizationId: string) =>
    ['queues', 'organization', organizationId] as const,
  byService: (serviceId: string) =>
    ['queues', 'service', serviceId] as const,
  detail: (queueId: string) => ['queues', 'detail', queueId] as const,
  business: (organizationId?: string) =>
    ['queues', 'business', organizationId ?? 'all'] as const,
  businessDetail: (queueId: string) =>
    ['queues', 'business-detail', queueId] as const,
  entries: (queueId: string) => ['queues', 'entries', queueId] as const,
  waiting: (queueId?: string) =>
    ['queues', 'waiting', queueId ?? 'all'] as const,
  preview: (serviceId: string) =>
    ['queues', 'preview', serviceId] as const,
};

export const ticketQueryKeys = {
  all: ['tickets'] as const,
  mine: ['tickets', 'mine'] as const,
  active: ['tickets', 'active'] as const,
  detail: (ticketId: string) => ['tickets', 'detail', ticketId] as const,
  progress: (ticketId: string) =>
    ['tickets', 'progress', ticketId] as const,
};
