import type { Session, User } from '@supabase/supabase-js';

import type { Profile } from '@/domain/models';
import { normalizeRole } from '@/features/auth/roles';
import type { AuthMethod, AuthSession, AuthUser } from '@/types/auth';
import type { ProfileRow } from '@/supabase/types';

export function mapAuthUser(user: User, role?: AuthUser['role']): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    avatarUrl:
      (user.user_metadata?.avatar_url as string | undefined) ?? null,
    role: role ?? normalizeRole(user.user_metadata?.role) ?? null,
  };
}

export function mapAuthSession(
  session: Session,
  role?: AuthUser['role'],
): AuthSession {
  const provider = session.user.app_metadata?.provider as string | undefined;
  const method: AuthMethod =
    provider === 'google'
      ? 'google'
      : session.user.phone
        ? 'phone'
        : session.user.email
          ? 'email'
          : 'demo';

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    method,
    user: mapAuthUser(session.user, role),
  };
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: normalizeRole(row.role),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mergeSessionWithProfile(
  session: AuthSession,
  profile: Profile | null,
): AuthSession {
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
