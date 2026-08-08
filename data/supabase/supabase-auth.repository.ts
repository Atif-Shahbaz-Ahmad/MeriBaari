import type { EmailOtpType } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

import type {
  AuthRepository,
  SignInWithEmailInput,
  SignUpResult,
  SignUpWithEmailInput,
} from '@/domain/repositories/auth.repository';
import type { Unsubscribe } from '@/domain/repositories/types';
import { AuthError, toAuthError } from '@/domain/errors/auth-error';
import { mapAuthSession } from '@/data/supabase/mappers';
import { getAuthRedirectUrl, parseAuthUrlParams } from '@/lib/auth-redirect';
import { getSupabase, requireSupabase } from '@/lib/supabase';
import type { AuthSession, AuthUser, OtpChannel, UserRole } from '@/types/auth';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_OTP_TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup'];

/**
 * Supabase Auth implementation.
 * UI and stores depend on AuthRepository — never import this class in screens.
 */
export class SupabaseAuthRepository implements AuthRepository {
  async getSession(): Promise<AuthSession | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw toAuthError(error);
      if (!data.session) return null;
      return mapAuthSession(data.session);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async refreshSession(): Promise<AuthSession | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw toAuthError(error);
      if (!data.session) return null;
      return mapAuthSession(data.session);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  onAuthStateChange(
    callback: (session: AuthSession | null) => void,
  ): Unsubscribe {
    const supabase = getSupabase();
    if (!supabase) {
      return () => undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session ? mapAuthSession(session) : null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }

  async sendOtp(channel: OtpChannel, destination: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      if (channel === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({
          phone: destination,
        });
        if (error) throw error;
      } else {
        // Default Supabase Auth emails (dev/testing): magic link and/or OTP.
        // emailRedirectTo must be the app deep link so confirm links open MeriBaari.
        const { error } = await supabase.auth.signInWithOtp({
          email: destination,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });
        if (error) throw error;
      }
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async verifyOtp(
    channel: OtpChannel,
    destination: string,
    token: string,
  ): Promise<AuthSession> {
    const supabase = requireSupabase();
    try {
      if (channel === 'phone') {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: destination,
          token,
          type: 'sms',
        });
        if (error) throw error;
        if (!data.session) {
          throw new AuthError(
            'invalid_otp',
            'Invalid or expired verification code.',
          );
        }
        return mapAuthSession(data.session);
      }

      // Email OTPs may arrive as magiclink / signup / email depending on template.
      let lastError: unknown;
      for (const type of EMAIL_OTP_TYPES) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: destination,
          token,
          type,
        });
        if (!error && data.session) {
          return mapAuthSession(data.session);
        }
        lastError = error;
      }

      throw lastError ?? new AuthError(
        'invalid_otp',
        'Invalid or expired verification code.',
      );
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async establishSessionFromUrl(url: string): Promise<AuthSession | null> {
    const supabase = requireSupabase();
    const params = parseAuthUrlParams(url);

    try {
      if (params.error || params.error_description) {
        throw new AuthError(
          'unauthorized',
          params.error_description || params.error || 'Auth link failed.',
        );
      }

      // PKCE code exchange
      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          params.code,
        );
        if (error) throw error;
        return data.session ? mapAuthSession(data.session) : null;
      }

      // Implicit tokens in hash/query
      if (params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) throw error;
        return data.session ? mapAuthSession(data.session) : null;
      }

      // token_hash from custom / confirm links
      if (params.token_hash && params.type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: params.type as EmailOtpType,
        });
        if (error) throw error;
        return data.session ? mapAuthSession(data.session) : null;
      }

      return null;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async signUpWithEmail(input: SignUpWithEmailInput): Promise<SignUpResult> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: {
            full_name: input.fullName ?? null,
            phone: input.phone ?? null,
            role: input.role ?? null,
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        return {
          session: mapAuthSession(data.session),
          needsEmailVerification: false,
        };
      }

      // No session usually means email confirmation is required.
      return {
        session: null,
        needsEmailVerification: true,
      };
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async signInWithEmail(input: SignInWithEmailInput): Promise<AuthSession> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) throw error;
      if (!data.session) {
        throw new AuthError(
          'invalid_credentials',
          'Invalid email or password. Please try again.',
        );
      }
      return mapAuthSession(data.session);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async signInWithGoogle(): Promise<AuthSession> {
    const supabase = requireSupabase();
    const redirectTo = getAuthRedirectUrl();

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      if (!data.url) {
        throw new AuthError('unknown', 'Google sign-in could not be started.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success' || !('url' in result) || !result.url) {
        throw new AuthError(
          'unauthorized',
          result.type === 'cancel'
            ? 'Google sign-in was cancelled.'
            : 'Google sign-in did not complete.',
        );
      }

      const session = await this.establishSessionFromUrl(result.url);
      if (!session) {
        throw new AuthError(
          'unknown',
          'Google sign-in completed but no session was returned.',
        );
      }
      return session;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async resetPassword(email: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl(),
      });
      if (error) throw error;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async resendSignupEmail(email: string): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      if (error) throw error;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async signOut(): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async createDemoSession(
    _role?: UserRole | null,
    _overrides?: Partial<AuthUser>,
  ): Promise<AuthSession> {
    throw new AuthError(
      'not_configured',
      'Demo sessions are disabled while Supabase Auth is configured.',
    );
  }

  async getDemoUser(_role: UserRole): Promise<AuthUser | null> {
    return null;
  }
}
