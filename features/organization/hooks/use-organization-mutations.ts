import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import type {
  OrganizationCreateInput,
  OrganizationUpdateInput,
} from '@/domain/repositories';
import { organizationQueryKeys } from '@/features/organization/query-keys';

function invalidateOrganizationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrganizationCreateInput) =>
      getContainer().organizationService.createOrganization(data),
    onSuccess: (org) => {
      queryClient.setQueryData(organizationQueryKeys.mine, org);
      queryClient.setQueryData(organizationQueryKeys.detail(org.id), org);
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: OrganizationUpdateInput;
    }) => getContainer().organizationService.updateOrganization(id, data),
    onSuccess: (org) => {
      queryClient.setQueryData(organizationQueryKeys.mine, org);
      queryClient.setQueryData(organizationQueryKeys.detail(org.id), org);
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useDeactivateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      getContainer().organizationService.deactivateOrganization(id),
    onSuccess: (org) => {
      queryClient.setQueryData(organizationQueryKeys.mine, org);
      queryClient.setQueryData(organizationQueryKeys.detail(org.id), org);
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useActivateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      getContainer().organizationService.activateOrganization(id),
    onSuccess: (org) => {
      queryClient.setQueryData(organizationQueryKeys.mine, org);
      queryClient.setQueryData(organizationQueryKeys.detail(org.id), org);
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      getContainer().organizationService.deleteOrganization(id),
    onSuccess: () => {
      queryClient.setQueryData(organizationQueryKeys.mine, null);
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      localUri,
    }: {
      organizationId: string;
      localUri: string;
    }) => getContainer().organizationService.uploadLogo(organizationId, localUri),
    onSuccess: (org) => {
      queryClient.setQueryData(organizationQueryKeys.mine, org);
      queryClient.setQueryData(organizationQueryKeys.detail(org.id), org);
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useRemoveOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) =>
      getContainer().organizationService.removeLogo(organizationId),
    onSuccess: (org) => {
      queryClient.setQueryData(organizationQueryKeys.mine, org);
      queryClient.setQueryData(organizationQueryKeys.detail(org.id), org);
      invalidateOrganizationQueries(queryClient);
    },
  });
}
