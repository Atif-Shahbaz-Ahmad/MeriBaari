import { create } from 'zustand';

interface JoinQueueState {
  organizationId: string | null;
  departmentId: string | null;
  serviceId: string | null;
  selectOrganization: (organizationId: string) => void;
  selectDepartment: (departmentId: string) => void;
  selectService: (serviceId: string) => void;
  clearService: () => void;
  clearDepartment: () => void;
  reset: () => void;
}

const initialState = {
  organizationId: null as string | null,
  departmentId: null as string | null,
  serviceId: null as string | null,
};

export const useJoinQueueStore = create<JoinQueueState>((set) => ({
  ...initialState,

  selectOrganization: (organizationId) =>
    set({
      organizationId,
      departmentId: null,
      serviceId: null,
    }),

  selectDepartment: (departmentId) =>
    set({
      departmentId,
      serviceId: null,
    }),

  selectService: (serviceId) => set({ serviceId }),

  clearService: () => set({ serviceId: null }),

  clearDepartment: () => set({ departmentId: null, serviceId: null }),

  reset: () => set(initialState),
}));
