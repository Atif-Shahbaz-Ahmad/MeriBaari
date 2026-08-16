import type { Favorite } from '@/domain/models/favorite';
import type { Organization } from '@/domain/models/organization';

export interface FavoritesRepository {
  /** Favorites for the authenticated user (newest first), optionally with orgs. */
  list(userId?: string): Promise<Favorite[]>;
  /** Favorite organizations for the authenticated user (newest first). */
  listOrganizations(userId?: string): Promise<Organization[]>;
  /** Whether the authenticated user has favorited this organization. */
  isFavorite(organizationId: string, userId?: string): Promise<boolean>;
  /** Organization IDs favorited by the authenticated user. */
  listOrganizationIds(userId?: string): Promise<string[]>;
  add(organizationId: string, userId?: string): Promise<Favorite>;
  remove(organizationId: string, userId?: string): Promise<void>;
}
