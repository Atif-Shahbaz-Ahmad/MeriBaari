import type { Review, ReviewCreateInput } from '@/domain/models/review';
import { ReviewError } from '@/domain/errors/review-error';
import type { ReviewsRepository } from '@/domain/repositories/reviews.repository';
import type { OrganizationRepository } from '@/domain/repositories/organization.repository';
import type { TicketRepository } from '@/domain/repositories/ticket.repository';

function newId() {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * In-memory reviews for demo mode (no Supabase).
 */
export class MockReviewsRepository implements ReviewsRepository {
  private rows: Review[] = [];

  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly tickets: TicketRepository,
  ) {}

  private resolveUserId(userId?: string): string {
    if (!userId) {
      throw new ReviewError('unauthorized', 'Please sign in to leave a review.');
    }
    return userId;
  }

  async listByOrganization(organizationId: string): Promise<Review[]> {
    return this.rows
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByTicketId(ticketId: string): Promise<Review | null> {
    return this.rows.find((r) => r.ticketId === ticketId) ?? null;
  }

  async listReviewedTicketIds(userId?: string): Promise<string[]> {
    const uid = this.resolveUserId(userId);
    return this.rows.filter((r) => r.userId === uid).map((r) => r.ticketId);
  }

  async create(input: ReviewCreateInput, userId?: string): Promise<Review> {
    const uid = this.resolveUserId(userId);
    const existing = await this.getByTicketId(input.ticketId);
    if (existing) {
      throw new ReviewError('duplicate', 'You already reviewed this visit.');
    }

    const ticket =
      (await this.tickets.getTicketById(input.ticketId)) ??
      (await this.tickets.getById(input.ticketId));

    if (!ticket) {
      throw new ReviewError('not_found', 'Ticket not found for review.');
    }

    const status = ticket.status;
    if (status !== 'completed' && status !== 'served') {
      throw new ReviewError(
        'not_eligible',
        'Only completed visits can be reviewed.',
      );
    }

    if (ticket.organizationId !== input.organizationId) {
      throw new ReviewError(
        'invalid_data',
        'Review organization does not match ticket.',
      );
    }

    const org = await this.organizations.getById(input.organizationId);
    const now = new Date().toISOString();
    const review: Review = {
      id: newId(),
      ticketId: input.ticketId,
      organizationId: input.organizationId,
      userId: uid,
      rating: input.rating,
      comment: input.comment?.trim() || null,
      createdAt: now,
      updatedAt: now,
      organizationName: org?.name ?? ticket.organizationName ?? null,
      ticketNumber: ticket.ticketNumber ?? null,
      reviewerName: null,
    };

    this.rows = [review, ...this.rows];

    // Best-effort aggregate update when org repo exposes mutable state via get/list.
    if (org && 'rating' in org) {
      const orgReviews = this.rows.filter(
        (r) => r.organizationId === input.organizationId,
      );
      const avg =
        orgReviews.reduce((sum, r) => sum + r.rating, 0) / orgReviews.length;
      org.rating = Math.round(avg * 100) / 100;
      org.reviewCount = orgReviews.length;
    }

    return review;
  }
}
