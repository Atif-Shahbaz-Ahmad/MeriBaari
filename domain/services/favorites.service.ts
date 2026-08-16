import type { Favorite } from '@/domain/models/favorite';
import type { Organization } from '@/domain/models/organization';
import type { FavoritesRepository } from '@/domain/repositories/favorites.repository';

export class FavoritesService {
  constructor(private readonly favorites: FavoritesRepository) {}

  list(userId?: string) {
    return this.favorites.list(userId);
  }

  listOrganizations(userId?: string) {
    return this.favorites.listOrganizations(userId);
  }

  listOrganizationIds(userId?: string) {
    return this.favorites.listOrganizationIds(userId);
  }

  isFavorite(organizationId: string, userId?: string) {
    return this.favorites.isFavorite(organizationId, userId);
  }

  add(organizationId: string, userId?: string) {
    return this.favorites.add(organizationId, userId);
  }

  remove(organizationId: string, userId?: string) {
    return this.favorites.remove(organizationId, userId);
  }

  /**
   * Toggle favorite. Returns the new favorited state.
   */
  async toggle(
    organizationId: string,
    currentlyFavorited: boolean,
    userId?: string,
  ): Promise<{ favorited: boolean; favorite?: Favorite }> {
    if (currentlyFavorited) {
      await this.favorites.remove(organizationId, userId);
      return { favorited: false };
    }
    const favorite = await this.favorites.add(organizationId, userId);
    return { favorited: true, favorite };
  }

  /** Convenience for UI that only needs organizations. */
  getFavoriteOrganizations(userId?: string): Promise<Organization[]> {
    return this.listOrganizations(userId);
  }
}
