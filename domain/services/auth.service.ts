import type { Profile } from '@/domain/models';
import type { AuthRepository } from '@/domain/repositories';
import type { ProfileRepository } from '@/domain/repositories';
import type {
  SignInWithEmailInput,
  SignUpWithEmailInput,
} from '@/domain/repositories/auth.repository';
import { ProfileService } from '@/domain/services/profile.service';
import type { AuthSession, AuthUser, OtpChannel, UserRole } from '@/types/auth';

export interface AuthenticatedContext {
  session: AuthSession;
  profile: Profile;
}

/**
 * Coordinates AuthRepository + ProfileRepository.
 * Ensures a profile row exists after successful authentication (idempotent).
 */
export class AuthService {
  private readonly profileHelpers: ProfileService;

  constructor(
    private readonly auth: AuthRepository,
    private readonly profiles: ProfileRepository,
  ) {
    this.profileHelpers = new ProfileService(profiles);
  }

  getSession() {
    return this.auth.getSession();
  }

  refreshSession() {
    return this.auth.refreshSession();
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    return this.auth.onAuthStateChange(callback);
  }

  sendOtp(channel: OtpChannel, destination: string) {
    return this.auth.sendOtp(channel, destination);
  }

  async verifyOtp(
    channel: OtpChannel,
    destination: string,
    token: string,
  ): Promise<AuthenticatedContext> {
    const session = await this.auth.verifyOtp(channel, destination, token);
    return this.hydrateWithProfile(session);
  }

  async establishSessionFromUrl(
    url: string,
  ): Promise<AuthenticatedContext | null> {
    const session = await this.auth.establishSessionFromUrl(url);
    if (!session) return null;
    return this.hydrateWithProfile(session);
  }

  async signUpWithEmail(
    input: SignUpWithEmailInput,
  ): Promise<{
    context: AuthenticatedContext | null;
    needsEmailVerification: boolean;
  }> {
    const result = await this.auth.signUpWithEmail(input);
    if (!result.session) {
      return {
        context: null,
        needsEmailVerification: result.needsEmailVerification,
      };
    }
    const context = await this.hydrateWithProfile(result.session, {
      fullName: input.fullName ?? null,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role ?? null,
    });
    return { context, needsEmailVerification: false };
  }

  async signInWithEmail(
    input: SignInWithEmailInput,
  ): Promise<AuthenticatedContext> {
    const session = await this.auth.signInWithEmail(input);
    return this.hydrateWithProfile(session);
  }

  async signInWithGoogle(): Promise<AuthenticatedContext> {
    const session = await this.auth.signInWithGoogle();
    return this.hydrateWithProfile(session);
  }

  resetPassword(email: string) {
    return this.auth.resetPassword(email);
  }

  resendSignupEmail(email: string) {
    return this.auth.resendSignupEmail(email);
  }

  signOut() {
    return this.auth.signOut();
  }

  async createDemoSession(
    role?: UserRole | null,
    overrides?: Partial<AuthUser>,
  ): Promise<AuthenticatedContext> {
    const session = await this.auth.createDemoSession(role, overrides);
    const profile = await this.profiles.ensure(session.user.id, {
      fullName: session.user.fullName,
      email: session.user.email,
      phone: session.user.phone,
      avatarUrl: session.user.avatarUrl,
      role: session.user.role ?? null,
    });
    return {
      session: this.profileHelpers.mergeSession(session, profile),
      profile,
    };
  }

  async setRole(userId: string, role: UserRole): Promise<Profile> {
    return this.profiles.setRole(userId, role);
  }

  async loadProfileForSession(
    session: AuthSession,
  ): Promise<AuthenticatedContext> {
    return this.hydrateWithProfile(session);
  }

  private async hydrateWithProfile(
    session: AuthSession,
    seed?: {
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      role?: UserRole | null;
    },
  ): Promise<AuthenticatedContext> {
    const profile = await this.profiles.ensure(session.user.id, {
      fullName: seed?.fullName ?? session.user.fullName,
      email: seed?.email ?? session.user.email,
      phone: seed?.phone ?? session.user.phone,
      avatarUrl: seed?.avatarUrl ?? session.user.avatarUrl,
      role: seed?.role ?? session.user.role ?? null,
    });

    return {
      session: this.profileHelpers.mergeSession(session, profile),
      profile,
    };
  }
}
