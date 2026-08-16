import type { FileStorageService } from '@/domain/future';
import { AuthError } from '@/domain/errors/auth-error';
import {
  optimizeAvatarImage,
  optimizeOrganizationLogoImage,
  optimizePaymentProofImage,
} from '@/lib/avatar-image';

/**
 * Local/demo file storage when Supabase is not configured.
 * Still optimizes images so UI behavior matches production.
 */
export class MockFileStorageService implements FileStorageService {
  private readonly avatars = new Map<string, string>();
  private readonly logos = new Map<string, string>();
  private readonly proofs = new Map<string, string>();

  async uploadAvatar(userId: string, uri: string): Promise<string> {
    if (!userId) {
      throw new AuthError('unauthorized', 'You must be signed in to upload an avatar.');
    }
    const optimized = await optimizeAvatarImage(uri);
    this.avatars.set(userId, optimized.uri);
    return optimized.uri;
  }

  async removeAvatar(userId: string, _avatarUrl?: string | null): Promise<void> {
    this.avatars.delete(userId);
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
    const optimized = await optimizeOrganizationLogoImage(uri);
    this.logos.set(organizationId, optimized.uri);
    return optimized.uri;
  }

  async removeOrganizationLogo(
    organizationId: string,
    _logoUrl?: string | null,
  ): Promise<void> {
    this.logos.delete(organizationId);
  }

  async uploadPaymentProof(userId: string, uri: string): Promise<string> {
    if (!userId) {
      throw new AuthError(
        'unauthorized',
        'You must be signed in to upload payment proof.',
      );
    }
    const optimized = await optimizePaymentProofImage(uri);
    const path = `${userId}/proof-${Date.now()}.jpg`;
    this.proofs.set(path, optimized.uri);
    return path;
  }

  async createPaymentProofSignedUrl(
    path: string,
    _expiresInSeconds?: number,
  ): Promise<string | null> {
    return this.proofs.get(path) ?? path;
  }

  getPublicUrl(path: string): string {
    return path;
  }
}
