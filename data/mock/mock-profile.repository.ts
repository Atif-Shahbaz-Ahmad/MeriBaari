import type { Profile } from '@/domain/models';
import type {
  ProfileEnsureInput,
  ProfileRepository,
  ProfileUpdateInput,
} from '@/domain/repositories';
import type { UserRole } from '@/types/auth';
import { MOCK_AUTH_USERS } from '@/mock/auth';
import { noopSubscribe } from './noop-subscribe';

function authUserToProfile(
  user: (typeof MOCK_AUTH_USERS)[string],
  createdAt = '2025-11-12T00:00:00.000Z',
): Profile {
  return {
    id: user.id,
    fullName: user.fullName ?? null,
    phone: user.phone ?? null,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role ?? null,
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * In-memory profile repository for demo mode (Supabase not configured).
 */
export class MockProfileRepository implements ProfileRepository {
  private currentId: string = MOCK_AUTH_USERS.customer.id;
  private profiles: Map<string, Profile> = new Map(
    Object.values(MOCK_AUTH_USERS).map((u) => [u.id, authUserToProfile(u)]),
  );

  async getById(id: string): Promise<Profile | null> {
    return this.profiles.get(id) ?? null;
  }

  async getCurrent(): Promise<Profile | null> {
    return this.profiles.get(this.currentId) ?? null;
  }

  setCurrentUserId(id: string): void {
    this.currentId = id;
  }

  async ensure(userId: string, seed?: ProfileEnsureInput): Promise<Profile> {
    const existing = this.profiles.get(userId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const profile: Profile = {
      id: userId,
      fullName: seed?.fullName ?? null,
      phone: seed?.phone ?? null,
      email: seed?.email ?? null,
      avatarUrl: seed?.avatarUrl ?? null,
      role: seed?.role ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.profiles.set(userId, profile);
    this.currentId = userId;
    return profile;
  }

  async update(id: string, input: ProfileUpdateInput): Promise<Profile> {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Profile not found: ${id}`);
    }
    const avatarUrl =
      input.avatarUrl !== undefined
        ? input.avatarUrl
        : input.avatar !== undefined
          ? input.avatar
          : existing.avatarUrl;

    const updated: Profile = {
      ...existing,
      fullName: input.fullName !== undefined ? input.fullName : existing.fullName,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      email: input.email !== undefined ? input.email : existing.email,
      avatarUrl,
      role: input.role !== undefined ? input.role : existing.role,
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(id, updated);
    return updated;
  }

  async setRole(id: string, role: UserRole): Promise<Profile> {
    return this.update(id, { role });
  }

  subscribe(id: string, callback: (payload: Profile) => void) {
    return noopSubscribe(callback);
  }
}
