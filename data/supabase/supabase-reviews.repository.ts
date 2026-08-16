import type { Review, ReviewCreateInput } from '@/domain/models/review';
import type { ReviewsRepository } from '@/domain/repositories/reviews.repository';
import { ReviewError, toReviewError } from '@/domain/errors/review-error';
import { requireSupabase } from '@/lib/supabase';
import type { ReviewRow } from '@/supabase/types/database';

type ReviewJoinRow = ReviewRow & {
  organizations?: { name: string } | { name: string }[] | null;
  tickets?: { ticket_number: string | null } | { ticket_number: string | null }[] | null;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapReviewRow(row: ReviewJoinRow): Review {
  const org = firstJoin(row.organizations);
  const ticket = firstJoin(row.tickets);
  const profile = firstJoin(row.profiles);

  return {
    id: row.id,
    ticketId: row.ticket_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    organizationName: org?.name ?? null,
    ticketNumber: ticket?.ticket_number ?? null,
    reviewerName: profile?.full_name ?? null,
  };
}

async function requireUserId(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) {
    throw new ReviewError('unauthorized', 'Please sign in to leave a review.');
  }
  return data.user.id;
}

export class SupabaseReviewsRepository implements ReviewsRepository {
  async listByOrganization(organizationId: string): Promise<Review[]> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, organizations(name), tickets(ticket_number), profiles(full_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapReviewRow(row as ReviewJoinRow));
    } catch (e) {
      throw toReviewError(e);
    }
  }

  async getByTicketId(ticketId: string): Promise<Review | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, organizations(name), tickets(ticket_number), profiles(full_name)')
        .eq('ticket_id', ticketId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapReviewRow(data as ReviewJoinRow) : null;
    } catch (e) {
      throw toReviewError(e);
    }
  }

  async listReviewedTicketIds(userId?: string): Promise<string[]> {
    const supabase = requireSupabase();
    try {
      const uid = await requireUserId(userId);
      const { data, error } = await supabase
        .from('reviews')
        .select('ticket_id')
        .eq('user_id', uid);
      if (error) throw error;
      return (data ?? []).map((row) => row.ticket_id as string);
    } catch (e) {
      throw toReviewError(e);
    }
  }

  async create(input: ReviewCreateInput, userId?: string): Promise<Review> {
    const supabase = requireSupabase();
    try {
      const uid = await requireUserId(userId);
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          ticket_id: input.ticketId,
          organization_id: input.organizationId,
          user_id: uid,
          rating: input.rating,
          comment: input.comment?.trim() || null,
        })
        .select('*, organizations(name), tickets(ticket_number), profiles(full_name)')
        .single();
      if (error) throw error;
      return mapReviewRow(data as ReviewJoinRow);
    } catch (e) {
      throw toReviewError(e);
    }
  }
}
