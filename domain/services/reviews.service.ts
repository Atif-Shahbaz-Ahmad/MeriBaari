import type { Review, ReviewCreateInput } from '@/domain/models/review';
import { ReviewError } from '@/domain/errors/review-error';
import type { ReviewsRepository } from '@/domain/repositories/reviews.repository';

export class ReviewsService {
  constructor(private readonly reviews: ReviewsRepository) {}

  listByOrganization(organizationId: string) {
    return this.reviews.listByOrganization(organizationId);
  }

  getByTicketId(ticketId: string) {
    return this.reviews.getByTicketId(ticketId);
  }

  listReviewedTicketIds(userId?: string) {
    return this.reviews.listReviewedTicketIds(userId);
  }

  create(input: ReviewCreateInput, userId?: string) {
    const rating = Math.round(Number(input.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new ReviewError(
        'invalid_data',
        'Please choose a rating between 1 and 5 stars.',
      );
    }

    const comment =
      typeof input.comment === 'string' ? input.comment.trim() : null;
    if (comment && comment.length > 1000) {
      throw new ReviewError(
        'invalid_data',
        'Review text must be 1000 characters or fewer.',
      );
    }

    return this.reviews.create(
      {
        ticketId: input.ticketId,
        organizationId: input.organizationId,
        rating,
        comment: comment || null,
      },
      userId,
    );
  }
}
