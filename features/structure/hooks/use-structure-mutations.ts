import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import type {
  DepartmentCreateInput,
  DepartmentUpdateInput,
  ServiceCreateInput,
  ServiceUpdateInput,
} from '@/domain/repositories';
import {
  departmentQueryKeys,
  serviceQueryKeys,
} from '@/features/structure/query-keys';

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepartmentCreateInput) =>
      getContainer().departmentService.createDepartment(data),
    onSuccess: (department) => {
      queryClient.setQueryData(
        departmentQueryKeys.detail(department.id),
        department,
      );
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.lists,
      });
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.list(department.organizationId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.list(department.organizationId, true),
      });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: DepartmentUpdateInput;
    }) => getContainer().departmentService.updateDepartment(id, data),
    onSuccess: (department) => {
      queryClient.setQueryData(
        departmentQueryKeys.detail(department.id),
        department,
      );
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.lists,
      });
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(department.id, false),
      });
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(department.id, true),
      });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      getContainer().departmentService.deleteDepartment(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: departmentQueryKeys.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.lists,
      });
      void queryClient.invalidateQueries({ queryKey: serviceQueryKeys.all });
    },
  });
}

export function useToggleDepartmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      activate,
    }: {
      id: string;
      activate: boolean;
    }) => {
      const service = getContainer().departmentService;
      return activate
        ? service.activateDepartment(id)
        : service.deactivateDepartment(id);
    },
    onSuccess: (department) => {
      queryClient.setQueryData(
        departmentQueryKeys.detail(department.id),
        department,
      );
      void queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.lists,
      });
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ServiceCreateInput) =>
      getContainer().serviceService.createService(data),
    onSuccess: (service) => {
      queryClient.setQueryData(serviceQueryKeys.detail(service.id), service);
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(service.departmentId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(service.departmentId, true),
      });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceUpdateInput }) =>
      getContainer().serviceService.updateService(id, data),
    onSuccess: (service) => {
      queryClient.setQueryData(serviceQueryKeys.detail(service.id), service);
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(service.departmentId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(service.departmentId, true),
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getContainer().serviceService.deleteService(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceQueryKeys.lists });
    },
  });
}

export function useToggleServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      activate,
    }: {
      id: string;
      activate: boolean;
    }) => {
      const service = getContainer().serviceService;
      return activate
        ? service.activateService(id)
        : service.deactivateService(id);
    },
    onSuccess: (service) => {
      queryClient.setQueryData(serviceQueryKeys.detail(service.id), service);
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(service.departmentId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(service.departmentId, true),
      });
    },
  });
}
