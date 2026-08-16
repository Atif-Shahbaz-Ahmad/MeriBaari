import type { Favorite } from '@/domain/models/favorite';
import type { Organization } from '@/domain/models/organization';
import { isOrganizationPublic } from '@/domain/models/organization';
import type { FavoritesRepository } from '@/domain/repositories/favorites.repository';
import type { OrganizationRepository } from '@/domain/repositories/organization.repository';
import { OrganizationError } from '@/domain/errors/organization-error';

function newId() {
  return `fav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * In-memory favorites for demo mode (no Supabase).
 */
export class MockFavoritesRepository implements FavoritesRepository {
  private rows: Favorite[] = [];

  constructor(private readonly organizations: OrganizationRepository) {}

  private resolveUserId(userId?: string): string {
    if (!userId) {
      throw new OrganizationError(
        'unauthorized',
        'Please sign in to manage favorites.',
      );
    }
    return userId;
  }

  async list(userId?: string): Promise<Favorite[]> {
    const uid = this.resolveUserId(userId);
    const orgs = await this.organizations.list({ activeOnly: true });
    const byId = new Map(orgs.map((o) => [o.id, o]));
    return this.rows
      .filter((r) => r.userId === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => ({
        ...r,
        organization: byId.get(r.organizationId) ?? r.organization ?? null,
      }));
  }

  async listOrganizations(userId?: string): Promise<Organization[]> {
    const favorites = await this.list(userId);
    return favorites
      .map((f) => f.organization)
      .filter(
        (org): org is Organization =>
          Boolean(org && isOrganizationPublic(org)),
      );
  }

  async listOrganizationIds(userId?: string): Promise<string[]> {
    const uid = this.resolveUserId(userId);
    return this.rows.filter((r) => r.userId === uid).map((r) => r.organizationId);
  }

  async isFavorite(organizationId: string, userId?: string): Promise<boolean> {
    const uid = this.resolveUserId(userId);
    return this.rows.some(
      (r) => r.userId === uid && r.organizationId === organizationId,
    );
  }

  async add(organizationId: string, userId?: string): Promise<Favorite> {
    const uid = this.resolveUserId(userId);
    if (await this.isFavorite(organizationId, uid)) {
      throw new OrganizationError(
        'duplicate',
        'This place is already in your favorites.',
      );
    }
    const org = await this.organizations.getById(organizationId);
    const favorite: Favorite = {
      id: newId(),
      userId: uid,
      organizationId,
      createdAt: new Date().toISOString(),
      organization: org,
    };
    this.rows = [favorite, ...this.rows];
    return favorite;
  }

  async remove(organizationId: string, userId?: string): Promise<void> {
    const uid = this.resolveUserId(userId);
    this.rows = this.rows.filter(
      (r) => !(r.userId === uid && r.organizationId === organizationId),
    );
  }
}
