import type {
  AuthRepository,
  SignInWithEmailInput,
  SignUpResult,
  SignUpWithEmailInput,
} from '@/domain/repositories/auth.repository';
import type { Unsubscribe } from '@/domain/repositories/types';
import { AuthError } from '@/domain/errors/auth-error';
import type { AuthSession, AuthUser, OtpChannel, UserRole } from '@/types/auth';
import { createMockSession, MOCK_AUTH_USERS } from '@/mock/auth';

/**
 * Demo auth repository used when Supabase env vars are not configured.
 * Supports the same interface as SupabaseAuthRepository for local development.
 */
export class MockAuthRepository implements AuthRepository {
  private session: AuthSession | null = null;
  private listeners = new Set<
    (session: AuthSession | null, event?: string) => void
  >();
  private pendingOtp = new Map<string, { channel: OtpChannel; destination: string }>();

  private emit(session: AuthSession | null, event = 'SIGNED_IN') {
    this.session = session;
    this.listeners.forEach((cb) => cb(session, session ? event : 'SIGNED_OUT'));
  }

  async getSession(): Promise<AuthSession | null> {
    return this.session;
  }

  async refreshSession(): Promise<AuthSession | null> {
    if (!this.session) return null;
    const refreshed: AuthSession = {
      ...this.session,
      accessToken: `demo_refresh_${Date.now()}`,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
    this.emit(refreshed, 'TOKEN_REFRESHED');
    return refreshed;
  }

  onAuthStateChange(
    callback: (session: AuthSession | null, event?: string) => void,
  ): Unsubscribe {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async sendOtp(channel: OtpChannel, destination: string): Promise<void> {
    this.pendingOtp.set(destination, { channel, destination });
  }

  async verifyOtp(
    channel: OtpChannel,
    destination: string,
    token: string,
  ): Promise<AuthSession> {
    if (!/^\d{6,8}$/.test(token)) {
      throw new AuthError('invalid_otp', 'Invalid or expired verification code.');
    }
    const session = createMockSession(null, {
      phone: channel === 'phone' ? destination : undefined,
      email: channel === 'email' ? destination : undefined,
    });
    session.method = channel;
    this.emit(session);
    this.pendingOtp.delete(destination);
    return session;
  }

  async establishSessionFromUrl(url: string): Promise<AuthSession | null> {
    // Demo: recovery links create a session so reset-password UI can be exercised.
    if (url.toLowerCase().includes('type=recovery') || url.toLowerCase().includes('recovery')) {
      const session = createMockSession(null, { email: 'reset.user@example.com' });
      session.method = 'email';
      this.emit(session, 'PASSWORD_RECOVERY');
      return session;
    }
    return null;
  }

  async signUpWithEmail(input: SignUpWithEmailInput): Promise<SignUpResult> {
    if (input.password.length < 6) {
      throw new AuthError(
        'weak_password',
        'Password is too weak. Use at least 6 characters.',
      );
    }
    const session = createMockSession(input.role ?? null, {
      email: input.email,
      fullName: input.fullName ?? null,
      phone: input.phone ?? null,
      role: input.role ?? null,
    });
    session.method = 'email';
    this.emit(session);
    return { session, needsEmailVerification: false };
  }

  async signInWithEmail(input: SignInWithEmailInput): Promise<AuthSession> {
    if (!input.email || !input.password) {
      throw new AuthError(
        'invalid_credentials',
        'Invalid email or password. Please try again.',
      );
    }
    if (input.password.length < 6) {
      throw new AuthError(
        'invalid_credentials',
        'Invalid email or password. Please try again.',
      );
    }
    const session = createMockSession(null, { email: input.email });
    session.method = 'email';
    this.emit(session);
    return session;
  }

  async signInWithGoogle(): Promise<AuthSession> {
    const session = createMockSession(null, {
      email: 'google.user@example.com',
      fullName: 'Google User',
    });
    session.method = 'google';
    this.emit(session);
    return session;
  }

  async resetPassword(_email: string): Promise<void> {
    // Demo: no-op success
  }

  async updatePassword(password: string): Promise<void> {
    if (!this.session) {
      throw new AuthError(
        'unauthorized',
        'You must open a valid reset link before setting a new password.',
      );
    }
    if (password.length < 6) {
      throw new AuthError(
        'weak_password',
        'Password is too weak. Use at least 6 characters.',
      );
    }
  }

  async resendSignupEmail(_email: string): Promise<void> {
    // Demo: no-op success
  }

  async signOut(): Promise<void> {
    this.emit(null, 'SIGNED_OUT');
  }

  async createDemoSession(
    role: UserRole | null = null,
    overrides?: Partial<AuthUser>,
  ): Promise<AuthSession> {
    const session = createMockSession(role, overrides);
    this.emit(session);
    return session;
  }

  async getDemoUser(role: UserRole): Promise<AuthUser | null> {
    return MOCK_AUTH_USERS[role] ?? null;
  }
}
