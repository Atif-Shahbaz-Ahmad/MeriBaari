import type { Organization } from './organization';

/**
 * Persisted favorite — customer ↔ organization only.
 */
export interface Favorite {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: string;
  /** Hydrated when listing favorites with organization join. */
  organization?: Organization | null;
}
