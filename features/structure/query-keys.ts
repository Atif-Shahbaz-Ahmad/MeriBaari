export const departmentQueryKeys = {
  all: ['departments'] as const,
  lists: ['departments', 'list'] as const,
  list: (organizationId: string, activeOnly: boolean) =>
    ['departments', 'list', organizationId, activeOnly] as const,
  details: ['departments', 'detail'] as const,
  detail: (id: string) => ['departments', 'detail', id] as const,
} as const;

export const serviceQueryKeys = {
  all: ['services'] as const,
  lists: ['services', 'list'] as const,
  list: (departmentId: string, activeOnly: boolean) =>
    ['services', 'list', departmentId, activeOnly] as const,
  details: ['services', 'detail'] as const,
  detail: (id: string) => ['services', 'detail', id] as const,
} as const;
