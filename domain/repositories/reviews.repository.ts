import type { Review, ReviewCreateInput } from '@/domain/models/review';

export interface ReviewsRepository {
  /** Reviews for an organization (newest first) — for owners/staff. */
  listByOrganization(organizationId: string): Promise<Review[]>;
  /** Review for a specific ticket, if any. */
  getByTicketId(ticketId: string): Promise<Review | null>;
  /** Ticket IDs the authenticated user has already reviewed. */
  listReviewedTicketIds(userId?: string): Promise<string[]>;
  /** Submit a rating for a completed ticket (one per ticket). */
  create(input: ReviewCreateInput, userId?: string): Promise<Review>;
}
