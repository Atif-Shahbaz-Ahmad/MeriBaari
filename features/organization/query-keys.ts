export const organizationQueryKeys = {
  all: ['organizations'] as const,
  lists: ['organizations', 'list'] as const,
  list: (query: string, category: string) =>
    ['organizations', 'list', query, category] as const,
  details: ['organizations', 'detail'] as const,
  detail: (id: string) => ['organizations', 'detail', id] as const,
  mine: ['organizations', 'mine'] as const,
} as const;
