import type {
  PushTokenRecord,
  PushTokenRepository,
  RegisterPushTokenInput,
} from '@/domain/repositories/push-token.repository';
import { AuthError } from '@/domain/errors/auth-error';
import {
  pushDiag,
  pushDiagError,
  redactToken,
} from '@/features/notifications/push-diagnostics';
import { requireSupabase } from '@/lib/supabase';

export class SupabasePushTokenRepository implements PushTokenRepository {
  async registerToken(input: RegisterPushTokenInput): Promise<string | null> {
    const supabase = requireSupabase();
    const token = input.token.trim();
    if (!token) {
      pushDiag('supabase_rpc', 'registerToken aborted — empty token');
      return null;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    pushDiag('supabase_rpc', 'Auth context before register_push_token RPC', {
      hasUser: Boolean(user),
      userIdPrefix: user?.id ? `${user.id.slice(0, 8)}…` : null,
      userError: userError?.message ?? null,
      platform: input.platform,
      tokenPreview: redactToken(token),
    });

    if (userError || !user) {
      pushDiag(
        'supabase_rpc',
        'Aborted — no authenticated user when calling register_push_token',
      );
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    pushDiag('supabase_rpc', 'Invoking RPC register_push_token');
    const { data, error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: input.platform,
      p_device_name: input.deviceName ?? null,
    });

    if (error) {
      pushDiag('supabase_rpc', 'register_push_token RPC error', {
        message: error.message,
        code: error.code ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
      });
      throw new Error('Failed to register device for push notifications.');
    }

    pushDiag('supabase_rpc', 'register_push_token RPC success', {
      rowIdPrefix: data ? `${String(data).slice(0, 8)}…` : null,
    });

    return (data as string | null) ?? null;
  }

  async deactivateToken(token: string): Promise<void> {
    const supabase = requireSupabase();
    const value = token.trim();
    if (!value) return;

    const { error } = await supabase.rpc('deactivate_push_token', {
      p_token: value,
    });

    if (error) {
      pushDiagError(
        'supabase_rpc',
        'deactivate_push_token failed',
        error.message,
      );
    }
  }

  async listActiveTokens(): Promise<PushTokenRecord[]> {
    const supabase = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AuthError('session_expired', 'You must be signed in.');
    }

    const { data, error } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error('Failed to load push tokens.');
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      token: row.token,
      platform: row.platform as PushTokenRecord['platform'],
      deviceName: row.device_name,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}
