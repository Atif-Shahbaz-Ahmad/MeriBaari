import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getContainer } from '@/data';
import type { ReviewCreateInput } from '@/domain/models';
import { organizationQueryKeys } from '@/features/organization/query-keys';
import { reviewsQueryKeys } from '@/features/reviews/query-keys';
import { useAuthStore } from '@/store/auth-store';

export function useOrganizationReviews(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: reviewsQueryKeys.byOrganization(organizationId ?? ''),
    queryFn: () =>
      getContainer().reviewsService.listByOrganization(organizationId!),
    enabled: Boolean(enabled && organizationId),
  });
}

export function useTicketReview(ticketId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: reviewsQueryKeys.byTicket(ticketId ?? ''),
    queryFn: () => getContainer().reviewsService.getByTicketId(ticketId!),
    enabled: Boolean(enabled && ticketId),
  });
}

export function useReviewedTicketIds(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: reviewsQueryKeys.reviewedTicketIds(userId),
    queryFn: () =>
      getContainer().reviewsService.listReviewedTicketIds(userId),
    enabled: Boolean(enabled && userId),
    staleTime: 30_000,
  });
}

export function useCreateReview() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewCreateInput) => {
      if (!userId) {
        throw new Error('Please sign in to leave a review.');
      }
      return getContainer().reviewsService.create(input, userId);
    },
    onSuccess: (review) => {
      void queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.byTicket(review.ticketId),
      });
      void queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.byOrganization(review.organizationId),
      });
      void queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.reviewedTicketIds(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.all,
      });
    },
  });
}
