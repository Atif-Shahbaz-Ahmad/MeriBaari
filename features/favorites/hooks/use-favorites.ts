import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getContainer } from '@/data';
import type { Organization } from '@/domain/models';
import { favoritesQueryKeys } from '@/features/favorites/query-keys';
import { useAuthStore } from '@/store/auth-store';

export function useFavoriteOrganizations(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: favoritesQueryKeys.organizations(userId),
    queryFn: () =>
      getContainer().favoritesService.listOrganizations(userId),
    enabled: Boolean(enabled && userId),
  });
}

export function useFavoriteOrganizationIds(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: favoritesQueryKeys.ids(userId),
    queryFn: () =>
      getContainer().favoritesService.listOrganizationIds(userId),
    enabled: Boolean(enabled && userId),
    staleTime: 30_000,
  });
}

export function useIsFavorite(organizationId: string | undefined, enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: ids = [], isLoading } = useFavoriteOrganizationIds(
    Boolean(enabled && organizationId),
  );

  return {
    isFavorite: organizationId ? ids.includes(organizationId) : false,
    isLoading,
    userId,
  };
}

/**
 * Optimistic add/remove favorite for an organization.
 * Rolls back ids + organization lists on failure.
 */
export function useToggleFavorite() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      currentlyFavorited,
    }: {
      organizationId: string;
      currentlyFavorited: boolean;
      organization?: Organization | null;
    }) => {
      if (!userId) {
        throw new Error('Please sign in to manage favorites.');
      }
      return getContainer().favoritesService.toggle(
        organizationId,
        currentlyFavorited,
        userId,
      );
    },
    onMutate: async ({ organizationId, currentlyFavorited, organization }) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: favoritesQueryKeys.all });

      const idsKey = favoritesQueryKeys.ids(userId);
      const orgsKey = favoritesQueryKeys.organizations(userId);

      const previousIds = queryClient.getQueryData<string[]>(idsKey);
      const previousOrgs = queryClient.getQueryData<Organization[]>(orgsKey);

      const nextIds = currentlyFavorited
        ? (previousIds ?? []).filter((id) => id !== organizationId)
        : Array.from(new Set([...(previousIds ?? []), organizationId]));

      queryClient.setQueryData(idsKey, nextIds);

      if (previousOrgs) {
        queryClient.setQueryData<Organization[]>(
          orgsKey,
          currentlyFavorited
            ? previousOrgs.filter((o) => o.id !== organizationId)
            : organization && !previousOrgs.some((o) => o.id === organizationId)
              ? [organization, ...previousOrgs]
              : previousOrgs,
        );
      }

      return { previousIds, previousOrgs, idsKey, orgsKey };
    },
    onError: (_error, _vars, context) => {
      if (!context) return;
      if (context.previousIds !== undefined) {
        queryClient.setQueryData(context.idsKey, context.previousIds);
      }
      if (context.previousOrgs !== undefined) {
        queryClient.setQueryData(context.orgsKey, context.previousOrgs);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.all });
    },
  });
}
