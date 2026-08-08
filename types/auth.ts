export type AuthMethod = 'phone' | 'email' | 'google' | 'demo';

/**
 * Application role — extend this union as new roles are added
 * (e.g. 'staff' | 'manager' | 'admin') without refactoring navigation.
 * Source of truth: Supabase `profiles.role` (mock only when env is unset).
 */
export type UserRole = 'customer' | 'business';

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  /** null until the user completes role selection */
  role?: UserRole | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: AuthUser;
  method: AuthMethod;
}

export type OtpChannel = 'phone' | 'email';

export interface SendOtpPayload {
  channel: OtpChannel;
  destination: string;
}

export interface VerifyOtpPayload {
  channel: OtpChannel;
  destination: string;
  token: string;
}
