import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import type { SubmitSubscriptionPaymentInput } from '@/domain/models/subscription';
import { organizationQueryKeys } from '@/features/organization/query-keys';
import { subscriptionQueryKeys } from '@/features/subscription/query-keys';
import { discoverQueryKeys } from '@/features/search/hooks/use-discover-search';

export function useMyLatestPayment(organizationId: string | undefined) {
  return useQuery({
    queryKey: subscriptionQueryKeys.mine(organizationId ?? ''),
    queryFn: () => {
      if (!organizationId) return null;
      return getContainer().subscriptionService.getLatestForOrganization(
        organizationId,
      );
    },
    enabled: Boolean(organizationId),
  });
}

export function useSubmitSubscriptionPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitSubscriptionPaymentInput) =>
      getContainer().subscriptionService.submitPayment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
    },
  });
}

export function useAdminSubscriptionStats() {
  return useQuery({
    queryKey: subscriptionQueryKeys.admin.stats,
    queryFn: () => getContainer().subscriptionService.getAdminStats(),
  });
}

export function useAdminPayments(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending') {
  return useQuery({
    queryKey: subscriptionQueryKeys.admin.list(status),
    queryFn: () => getContainer().subscriptionService.listAdminPayments(status),
  });
}

export function useAdminPayment(paymentId: string | undefined) {
  return useQuery({
    queryKey: subscriptionQueryKeys.admin.detail(paymentId ?? ''),
    queryFn: () => {
      if (!paymentId) return null;
      return getContainer().subscriptionService.getAdminPayment(paymentId);
    },
    enabled: Boolean(paymentId),
  });
}

export function useAdminActiveBusinesses() {
  return useQuery({
    queryKey: subscriptionQueryKeys.admin.businesses,
    queryFn: () => getContainer().subscriptionService.listAdminActiveBusinesses(),
  });
}

export function useAdminBusiness(organizationId: string | undefined) {
  return useQuery({
    queryKey: subscriptionQueryKeys.admin.business(organizationId ?? ''),
    queryFn: () => {
      if (!organizationId) return null;
      return getContainer().subscriptionService.getAdminBusiness(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

export function useReviewSubscriptionPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      action,
      reason,
    }: {
      paymentId: string;
      action: 'approve' | 'reject';
      reason?: string;
    }) => {
      const service = getContainer().subscriptionService;
      return action === 'approve'
        ? service.approvePayment(paymentId)
        : service.rejectPayment(paymentId, reason ?? '');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: discoverQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.admin.businesses,
      });
    },
  });
}

export function useSetAdminBusinessVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      visible,
      reason,
    }: {
      organizationId: string;
      visible: boolean;
      reason?: string;
    }) =>
      getContainer().subscriptionService.setAdminVisibility(
        organizationId,
        visible,
        reason,
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: discoverQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.admin.businesses,
      });
      void queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.admin.business(variables.organizationId),
      });
    },
  });
}
