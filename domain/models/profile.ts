import type { UserRole } from '@/types/auth';

/**
 * Canonical profile entity — maps to `profiles` table.
 */
export interface Profile {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  /** Maps to `profiles.avatar_url`. */
  avatarUrl: string | null;
  role: UserRole | null;
  createdAt: string;
  updatedAt: string;
}
