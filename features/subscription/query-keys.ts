export const subscriptionQueryKeys = {
  all: ['subscription'] as const,
  mine: (organizationId: string) =>
    ['subscription', 'mine', organizationId] as const,
  admin: {
    all: ['subscription', 'admin'] as const,
    stats: ['subscription', 'admin', 'stats'] as const,
    list: (status: string) =>
      ['subscription', 'admin', 'list', status] as const,
    detail: (paymentId: string) =>
      ['subscription', 'admin', 'detail', paymentId] as const,
    businesses: ['subscription', 'admin', 'businesses'] as const,
    business: (organizationId: string) =>
      ['subscription', 'admin', 'business', organizationId] as const,
  },
} as const;
