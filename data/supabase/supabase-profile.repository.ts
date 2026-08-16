import type { Profile } from '@/domain/models';
import type {
  ProfileEnsureInput,
  ProfileRepository,
  ProfileUpdateInput,
} from '@/domain/repositories';
import type { Unsubscribe, SubscribeCallback } from '@/domain/repositories/types';
import { AuthError, toAuthError } from '@/domain/errors/auth-error';
import { mapProfileRow } from '@/data/supabase/mappers';
import { noopSubscribe } from '@/data/mock/noop-subscribe';
import { isSelectableRole } from '@/features/auth/roles';
import { requireSupabase } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';

/**
 * Supabase profiles table implementation.
 */
export class SupabaseProfileRepository implements ProfileRepository {
  async getById(id: string): Promise<Profile | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapProfileRow(data) : null;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async getCurrent(): Promise<Profile | null> {
    const supabase = requireSupabase();
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) return null;
      return this.getById(authData.user.id);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async ensure(userId: string, seed?: ProfileEnsureInput): Promise<Profile> {
    const existing = await this.getById(userId);
    if (existing) {
      // Backfill contact fields if the trigger created an empty row
      const needsPatch =
        (seed?.email && !existing.email) ||
        (seed?.phone && !existing.phone) ||
        (seed?.fullName && !existing.fullName) ||
        (seed?.role && !existing.role);

      if (needsPatch) {
        return this.update(userId, {
          email: existing.email ?? seed?.email ?? null,
          phone: existing.phone ?? seed?.phone ?? null,
          fullName: existing.fullName ?? seed?.fullName ?? null,
          avatarUrl: existing.avatarUrl ?? seed?.avatarUrl ?? null,
          role: existing.role ?? seed?.role ?? null,
        });
      }
      return existing;
    }

    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: seed?.fullName ?? null,
          email: seed?.email ?? null,
          phone: seed?.phone ?? null,
          avatar_url: seed?.avatarUrl ?? null,
          role: seed?.role ?? null,
        })
        .select('*')
        .single();

      if (error) {
        // Race with DB trigger — fetch existing
        const raced = await this.getById(userId);
        if (raced) return raced;
        throw error;
      }

      return mapProfileRow(data);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async update(id: string, input: ProfileUpdateInput): Promise<Profile> {
    const supabase = requireSupabase();
    const avatarUrl =
      input.avatarUrl !== undefined
        ? input.avatarUrl
        : input.avatar !== undefined
          ? input.avatar
          : undefined;

    try {
      const patch: {
        full_name?: string | null;
        phone?: string | null;
        email?: string | null;
        avatar_url?: string | null;
        role?: UserRole | null;
      } = {};
      if (input.fullName !== undefined) patch.full_name = input.fullName;
      if (input.phone !== undefined) patch.phone = input.phone;
      if (input.email !== undefined) patch.email = input.email;
      if (avatarUrl !== undefined) patch.avatar_url = avatarUrl;
      if (input.role !== undefined) {
        if (input.role !== null && !isSelectableRole(input.role)) {
          throw new AuthError(
            'unauthorized',
            'Invalid role. Only customer or business is allowed.',
          );
        }
        patch.role = input.role;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) {
        throw new AuthError('unknown', 'Failed to update profile.');
      }
      return mapProfileRow(data);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async setRole(id: string, role: UserRole): Promise<Profile> {
    return this.update(id, { role });
  }

  subscribe(id: string, callback: SubscribeCallback<Profile>): Unsubscribe {
    return noopSubscribe(callback);
  }
}
