import { AuthError } from '@/domain/errors/auth-error';
import type { FileStorageService } from '@/domain/future';
import type { Profile } from '@/domain/models';
import type { ProfileRepository } from '@/domain/repositories';
import type {
  ProfileEnsureInput,
  ProfileUpdateInput,
} from '@/domain/repositories';
import { isSelectableRole, normalizeRole } from '@/features/auth/roles';
import type { AuthSession } from '@/types/auth';
import type { UserRole } from '@/types/auth';

export interface AvatarPlaceholder {
  /** Display name used for initials when no image is set. */
  name: string | null;
  /** Remote/local avatar URI, or null for initials placeholder. */
  uri: string | null;
}

/**
 * Profile use-cases: fetch, update, refresh, role validation, avatar upload.
 * UI never talks to Supabase — only through this service + repository.
 */
export class ProfileService {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly files?: FileStorageService,
  ) {}

  getById(id: string) {
    return this.profiles.getById(id);
  }

  /** Alias — Prompt contract naming. */
  getProfileById(id: string) {
    return this.getById(id);
  }

  getCurrent() {
    return this.profiles.getCurrent();
  }

  /** Alias — Prompt contract naming. */
  getCurrentProfile() {
    return this.getCurrent();
  }

  /** Re-fetch the signed-in user's profile from the repository. */
  refresh() {
    return this.profiles.getCurrent();
  }

  ensure(userId: string, seed?: ProfileEnsureInput) {
    const role = this.requireAppRoleOrNull(seed?.role);
    return this.profiles.ensure(userId, { ...seed, role });
  }

  /** Alias — create if missing (idempotent). */
  createProfile(userId: string, seed?: ProfileEnsureInput) {
    return this.ensure(userId, seed);
  }

  update(id: string, input: ProfileUpdateInput) {
    const patch = this.sanitizeUpdate(input);
    return this.profiles.update(id, patch);
  }

  /** Alias — Prompt contract naming. */
  updateProfile(id: string, input: ProfileUpdateInput) {
    return this.update(id, input);
  }

  /**
   * Optimize + upload avatar, then persist `profiles.avatar_url`.
   * Replaces overwrite the same storage path (no orphaned objects).
   */
  async uploadAvatar(userId: string, localUri: string): Promise<Profile> {
    if (!this.files) {
      throw new AuthError(
        'not_configured',
        'Avatar upload is not available right now.',
      );
    }
    const publicUrl = await this.files.uploadAvatar(userId, localUri);
    return this.profiles.update(userId, { avatarUrl: publicUrl });
  }

  /** Remove storage object (if any) and clear `profiles.avatar_url`. */
  async removeAvatar(userId: string): Promise<Profile> {
    const existing = await this.profiles.getById(userId);
    if (this.files) {
      await this.files.removeAvatar(userId, existing?.avatarUrl);
    }
    return this.profiles.update(userId, { avatarUrl: null });
  }

  setRole(id: string, role: UserRole) {
    if (!isSelectableRole(role)) {
      throw new AuthError(
        'unauthorized',
        'Invalid role. Only customer or business is allowed.',
      );
    }
    return this.profiles.setRole(id, role);
  }

  /**
   * Require a valid app role on a loaded profile.
   * Returns the normalized role or throws.
   */
  requireValidRole(profile: Profile | null | undefined): UserRole {
    const role = normalizeRole(profile?.role);
    if (!role) {
      throw new AuthError(
        'unauthorized',
        'Your profile is missing a valid role. Please choose Customer or Business.',
      );
    }
    return role;
  }

  hasValidRole(profile: Profile | null | undefined): boolean {
    return normalizeRole(profile?.role) !== null;
  }

  getAvatarPlaceholder(
    profile: Profile | null | undefined,
    fallbackName?: string | null,
  ): AvatarPlaceholder {
    return {
      name: profile?.fullName ?? fallbackName ?? null,
      uri: profile?.avatarUrl ?? null,
    };
  }

  /** Merge profile fields onto an auth session user (`profiles.role` wins). */
  mergeSession(session: AuthSession, profile: Profile | null): AuthSession {
    if (!profile) return session;
    return {
      ...session,
      user: {
        ...session.user,
        fullName: profile.fullName ?? session.user.fullName,
        phone: profile.phone ?? session.user.phone,
        email: profile.email ?? session.user.email,
        avatarUrl: profile.avatarUrl,
        role: normalizeRole(profile.role),
      },
    };
  }

  private sanitizeUpdate(input: ProfileUpdateInput): ProfileUpdateInput {
    if (input.role === undefined) return input;
    if (input.role === null) {
      return { ...input, role: null };
    }
    if (!isSelectableRole(input.role)) {
      throw new AuthError(
        'unauthorized',
        'Invalid role. Only customer or business is allowed.',
      );
    }
    return input;
  }

  private requireAppRoleOrNull(
    role: UserRole | null | undefined,
  ): UserRole | null {
    if (role == null) return null;
    if (!isSelectableRole(role)) {
      throw new AuthError(
        'unauthorized',
        'Invalid role. Only customer or business is allowed.',
      );
    }
    return role;
  }
}
