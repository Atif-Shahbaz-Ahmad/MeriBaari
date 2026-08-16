export const favoritesQueryKeys = {
  all: ['favorites'] as const,
  lists: ['favorites', 'list'] as const,
  list: (userId?: string) => ['favorites', 'list', userId ?? 'anon'] as const,
  organizations: (userId?: string) =>
    ['favorites', 'organizations', userId ?? 'anon'] as const,
  ids: (userId?: string) => ['favorites', 'ids', userId ?? 'anon'] as const,
  isFavorite: (organizationId: string, userId?: string) =>
    ['favorites', 'is', organizationId, userId ?? 'anon'] as const,
};
