import type { AuthSession, AuthUser, OtpChannel, UserRole } from '@/types/auth';
import type { Unsubscribe } from './types';

export interface SignUpWithEmailInput {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  /** Stored in user metadata + profile when session is available. */
  role?: UserRole | null;
}

export interface SignInWithEmailInput {
  email: string;
  password: string;
}

export interface SignUpResult {
  session: AuthSession | null;
  needsEmailVerification: boolean;
}

/**
 * Authentication repository — Supabase Auth (or mock fallback).
 */
export interface AuthRepository {
  getSession(): Promise<AuthSession | null>;
  refreshSession(): Promise<AuthSession | null>;
  onAuthStateChange(
    callback: (
      session: AuthSession | null,
      event?: string,
    ) => void,
  ): Unsubscribe;

  sendOtp(channel: OtpChannel, destination: string): Promise<void>;
  verifyOtp(
    channel: OtpChannel,
    destination: string,
    token: string,
  ): Promise<AuthSession>;

  /** Complete auth from a magic-link / confirm deep link. */
  establishSessionFromUrl(url: string): Promise<AuthSession | null>;

  signUpWithEmail(input: SignUpWithEmailInput): Promise<SignUpResult>;
  signInWithEmail(input: SignInWithEmailInput): Promise<AuthSession>;
  /** Opens Google OAuth (browser) and returns an app session. */
  signInWithGoogle(): Promise<AuthSession>;
  resetPassword(email: string): Promise<void>;
  /** Set a new password for the currently authenticated (recovery) session. */
  updatePassword(password: string): Promise<void>;
  /** Resend signup confirmation email (default Supabase Auth email). */
  resendSignupEmail(email: string): Promise<void>;

  signOut(): Promise<void>;

  createDemoSession(
    role?: UserRole | null,
    overrides?: Partial<AuthUser>,
  ): Promise<AuthSession>;

  getDemoUser(role: UserRole): Promise<AuthUser | null>;
}
