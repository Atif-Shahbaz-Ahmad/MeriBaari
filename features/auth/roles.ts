import type { UserRole } from '@/types';

export function isUserRole(value: unknown): value is UserRole {
  return value === 'customer' || value === 'business';
}

export function normalizeRole(value: unknown): UserRole | null {
  return isUserRole(value) ? value : null;
}
