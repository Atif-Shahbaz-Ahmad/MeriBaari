import type { UserRole } from '@/types';

/** Roles a user may choose at signup / role-select. Admin is assigned in the database only. */
export type SelectableUserRole = 'customer' | 'business';

export function isSelectableRole(value: unknown): value is SelectableUserRole {
  return value === 'customer' || value === 'business';
}

export function isUserRole(value: unknown): value is UserRole {
  return isSelectableRole(value) || value === 'admin';
}

export function isAdminRole(value: unknown): value is 'admin' {
  return value === 'admin';
}

export function normalizeRole(value: unknown): UserRole | null {
  return isUserRole(value) ? value : null;
}
