import type { FileStorageService } from '@/domain/future';
import { AuthError, toAuthError } from '@/domain/errors/auth-error';
import {
  optimizeAvatarImage,
  optimizeOrganizationLogoImage,
  optimizePaymentProofImage,
} from '@/lib/avatar-image';
import { requireSupabase } from '@/lib/supabase';

const AVATARS_BUCKET = 'avatars';
const AVATAR_FILE = 'avatar.jpg';

const ORG_LOGOS_BUCKET = 'organization-logos';
const ORG_LOGO_FILE = 'logo.jpg';

const PAYMENT_PROOFS_BUCKET = 'payment-proofs';

function avatarObjectPath(userId: string): string {
  return `${userId}/${AVATAR_FILE}`;
}

function organizationLogoObjectPath(organizationId: string): string {
  return `organizations/${organizationId}/${ORG_LOGO_FILE}`;
}

/**
 * Supabase Storage for profile avatars and organization logos.
 * Deterministic paths so replaces overwrite (no orphan objects).
 */
export class SupabaseFileStorageService implements FileStorageService {
  async uploadAvatar(userId: string, uri: string): Promise<string> {
    if (!userId) {
      throw new AuthError('unauthorized', 'You must be signed in to upload an avatar.');
    }

    const supabase = requireSupabase();
    try {
      const optimized = await optimizeAvatarImage(uri);
      const path = avatarObjectPath(userId);
      const response = await fetch(optimized.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, arrayBuffer, {
        contentType: optimized.mimeType,
        upsert: true,
        cacheControl: '3600',
      });
      if (error) throw error;

      return this.publicUrl(AVATARS_BUCKET, path);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async removeAvatar(userId: string, _avatarUrl?: string | null): Promise<void> {
    if (!userId) return;
    const supabase = requireSupabase();
    try {
      const path = avatarObjectPath(userId);
      const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([path]);
      if (error && !/not\s*found|404|does not exist/i.test(error.message)) {
        throw error;
      }
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async uploadOrganizationLogo(
    organizationId: string,
    uri: string,
  ): Promise<string> {
    if (!organizationId) {
      throw new AuthError(
        'unauthorized',
        'Organization is required to upload a logo.',
      );
    }

    const supabase = requireSupabase();
    try {
      const optimized = await optimizeOrganizationLogoImage(uri);
      const path = organizationLogoObjectPath(organizationId);
      const response = await fetch(optimized.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from(ORG_LOGOS_BUCKET)
        .upload(path, arrayBuffer, {
          contentType: optimized.mimeType,
          upsert: true,
          cacheControl: '3600',
        });
      if (error) throw error;

      return this.publicUrl(ORG_LOGOS_BUCKET, path);
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async removeOrganizationLogo(
    organizationId: string,
    _logoUrl?: string | null,
  ): Promise<void> {
    if (!organizationId) return;
    const supabase = requireSupabase();
    try {
      const path = organizationLogoObjectPath(organizationId);
      const { error } = await supabase.storage
        .from(ORG_LOGOS_BUCKET)
        .remove([path]);
      if (error && !/not\s*found|404|does not exist/i.test(error.message)) {
        throw error;
      }
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async uploadPaymentProof(userId: string, uri: string): Promise<string> {
    if (!userId) {
      throw new AuthError(
        'unauthorized',
        'You must be signed in to upload payment proof.',
      );
    }

    const supabase = requireSupabase();
    try {
      const optimized = await optimizePaymentProofImage(uri);
      const path = `${userId}/proof-${Date.now()}.jpg`;
      const response = await fetch(optimized.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from(PAYMENT_PROOFS_BUCKET)
        .upload(path, arrayBuffer, {
          contentType: optimized.mimeType,
          upsert: false,
          cacheControl: '3600',
        });
      if (error) throw error;
      return path;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  async createPaymentProofSignedUrl(
    path: string,
    expiresInSeconds = 60 * 10,
  ): Promise<string | null> {
    if (!path) return null;
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.storage
        .from(PAYMENT_PROOFS_BUCKET)
        .createSignedUrl(path, expiresInSeconds);
      if (error) throw error;
      return data.signedUrl ?? null;
    } catch (e) {
      throw toAuthError(e);
    }
  }

  /** Interface compatibility — avatar paths resolve against the avatars bucket. */
  getPublicUrl(path: string): string {
    return this.publicUrl(AVATARS_BUCKET, path);
  }

  private publicUrl(bucket: string, path: string): string {
    const supabase = requireSupabase();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const base = data.publicUrl;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}v=${Date.now()}`;
  }
}
