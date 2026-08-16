/**
 * Customer rating for a completed (served) ticket visit.
 * One review per ticket; aggregates live on the organization.
 */
export interface Review {
  id: string;
  ticketId: string;
  organizationId: string;
  userId: string;
  /** Integer 1–5. */
  rating: number;
  /** Optional written feedback. */
  comment: string | null;
  createdAt: string;
  updatedAt: string;

  /** Hydrated display fields (optional joins). */
  organizationName?: string | null;
  ticketNumber?: string | null;
  reviewerName?: string | null;
}

export interface ReviewCreateInput {
  ticketId: string;
  organizationId: string;
  rating: number;
  comment?: string | null;
}
