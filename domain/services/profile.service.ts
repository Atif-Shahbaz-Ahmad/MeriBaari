import type { Profile } from '@/domain/models';
import type { ProfileRepository } from '@/domain/repositories';
import type {
  ProfileEnsureInput,
  ProfileUpdateInput,
} from '@/domain/repositories';
import type { AuthSession } from '@/types/auth';
import type { UserRole } from '@/types/auth';

export interface AvatarPlaceholder {
  /** Display name used for initials when no image is set. */
  name: string | null;
  /** Remote/local avatar URI, or null for initials placeholder. */
  uri: string | null;
}

/**
 * Profile use-cases: fetch, update, refresh, avatar placeholder.
 * UI never talks to Supabase — only through this service + repository.
 */
export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}

  getById(id: string) {
    return this.profiles.getById(id);
  }

  getCurrent() {
    return this.profiles.getCurrent();
  }

  /** Re-fetch the signed-in user's profile from the repository. */
  refresh() {
    return this.profiles.getCurrent();
  }

  ensure(userId: string, seed?: ProfileEnsureInput) {
    return this.profiles.ensure(userId, seed);
  }

  update(id: string, input: ProfileUpdateInput) {
    return this.profiles.update(id, input);
  }

  setRole(id: string, role: UserRole) {
    return this.profiles.setRole(id, role);
  }

  /**
   * Avatar display helper for current / future profile editing screens.
   * Returns initials-friendly name + optional image URI.
   */
  getAvatarPlaceholder(
    profile: Profile | null | undefined,
    fallbackName?: string | null,
  ): AvatarPlaceholder {
    return {
      name: profile?.fullName ?? fallbackName ?? null,
      uri: profile?.avatarUrl ?? null,
    };
  }

  /** Merge profile fields onto an auth session user (role from profiles wins). */
  mergeSession(session: AuthSession, profile: Profile | null): AuthSession {
    if (!profile) return session;
    return {
      ...session,
      user: {
        ...session.user,
        fullName: profile.fullName ?? session.user.fullName,
        phone: profile.phone ?? session.user.phone,
        email: profile.email ?? session.user.email,
        avatarUrl: profile.avatarUrl ?? session.user.avatarUrl,
        role: profile.role ?? session.user.role ?? null,
      },
    };
  }
}
