import type { Profile } from '@/domain/models';
import type { UserRole } from '@/types/auth';
import type { Unsubscribe, SubscribeCallback } from './types';

export interface ProfileUpdateInput {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  /** @deprecated Prefer avatarUrl */
  avatar?: string | null;
  role?: UserRole | null;
}

export interface ProfileEnsureInput {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: UserRole | null;
}

export interface ProfileRepository {
  getById(id: string): Promise<Profile | null>;
  getCurrent(): Promise<Profile | null>;
  /**
   * Ensure a profile row exists for the authenticated user (post sign-up).
   * Idempotent — returns the existing row when already present.
   */
  ensure(userId: string, seed?: ProfileEnsureInput): Promise<Profile>;
  update(id: string, input: ProfileUpdateInput): Promise<Profile>;
  setRole(id: string, role: UserRole): Promise<Profile>;
  /** Placeholder for realtime profile changes. */
  subscribe(id: string, callback: SubscribeCallback<Profile>): Unsubscribe;
}
