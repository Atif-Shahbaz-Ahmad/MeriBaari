export type AuthMethod = 'phone' | 'email' | 'google' | 'demo';

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
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
