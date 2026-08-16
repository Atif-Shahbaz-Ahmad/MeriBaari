export const historyQueryKeys = {
  all: ['history'] as const,
  customer: (params?: { limit?: number; offset?: number }) =>
    [
      'history',
      'customer',
      params?.limit ?? 40,
      params?.offset ?? 0,
    ] as const,
  organization: (
    organizationId: string,
    params?: { limit?: number; offset?: number },
  ) =>
    [
      'history',
      'organization',
      organizationId,
      params?.limit ?? 40,
      params?.offset ?? 0,
    ] as const,
  myStatistics: () => ['history', 'statistics', 'me'] as const,
  servedToday: (organizationId: string) =>
    ['history', 'served-today', organizationId] as const,
};
