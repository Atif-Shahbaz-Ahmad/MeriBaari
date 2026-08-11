export const profileQueryKeys = {
  all: ['profile'] as const,
  current: ['profile', 'current'] as const,
  byId: (id: string) => ['profile', id] as const,
} as const;
