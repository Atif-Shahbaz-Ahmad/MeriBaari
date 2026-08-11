import type { AvailabilityStatus } from '@/types/organization';

/** Department status — maps to `departments.status`. */
export type DepartmentStatus = 'active' | 'inactive' | 'paused';

export const DEPARTMENT_ICON_IDS = [
  'stethoscope',
  'heart',
  'tooth',
  'eye',
  'siren',
  'scan',
  'flask',
  'users',
  'file',
  'car',
] as const;

export type DepartmentIcon = (typeof DEPARTMENT_ICON_IDS)[number];

/**
 * Canonical department entity — maps to `departments` table.
 */
export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  icon: DepartmentIcon;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  status: DepartmentStatus;

  /** Legacy / catalog fields used by join-queue UI. */
  estimatedServiceTime: number;
  averageWaitMinutes: number;
  estimatedQueueSize: number;
  availability: AvailabilityStatus;
  serviceIds: string[];
}
