import type {
  AdminBusinessSummary,
  AdminSubscriptionStats,
  SubscriptionPayment,
  SubscriptionPaymentMethod,
  SubscriptionPaymentReview,
  SubscriptionPaymentStatus,
} from '@/domain/models/subscription';
import type { SubscriptionRepository } from '@/domain/repositories/subscription.repository';
import {
  SubscriptionError,
  toSubscriptionError,
} from '@/domain/errors/subscription-error';
import { mapSubscriptionPaymentRow } from '@/data/supabase/mappers-subscription';
import { requireSupabase } from '@/lib/supabase';
import type { SubscriptionPaymentRow } from '@/supabase/types/database';

/** Disambiguate profiles: user_id is the submitter, reviewed_by is the admin. */
const ADMIN_PAYMENT_SELECT =
  '*, organizations(name, category, phone, address, city, latitude, longitude, logo_url, owner_id), profiles!user_id(full_name, email, phone)';

/** Disambiguate profiles: owner_id is the business owner, approved_by is the admin. */
const ADMIN_BUSINESS_SELECT =
  'id, name, category, phone, email, address, city, latitude, longitude, logo_url, working_hours, approved_at, is_active, status, admin_hidden, admin_hidden_reason, admin_hidden_at, profiles!owner_id(full_name, email, phone)';

type PaymentJoinRow = SubscriptionPaymentRow & {
  organizations?:
    | {
        name: string | null;
        category: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
        logo_url: string | null;
        owner_id: string | null;
      }
    | {
        name: string | null;
        category: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
        logo_url: string | null;
        owner_id: string | null;
      }[]
    | null;
  profiles?:
    | { full_name: string | null; email: string | null; phone: string | null }
    | { full_name: string | null; email: string | null; phone: string | null }[]
    | null;
};

type AdminBusinessJoinRow = {
  id: string;
  name: string | null;
  category: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  working_hours: string | null;
  approved_at: string | null;
  is_active: boolean | null;
  status: string | null;
  admin_hidden: boolean | null;
  admin_hidden_reason: string | null;
  admin_hidden_at: string | null;
  profiles?:
    | { full_name: string | null; email: string | null; phone: string | null }
    | { full_name: string | null; email: string | null; phone: string | null }[]
    | null;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapJoinedPayment(row: PaymentJoinRow): SubscriptionPayment {
  const org = firstJoin(row.organizations);
  const owner = firstJoin(row.profiles);
  return {
    ...mapSubscriptionPaymentRow(row),
    organizationName: org?.name ?? null,
    ownerName: owner?.full_name ?? null,
    ownerEmail: owner?.email ?? null,
    ownerPhone: owner?.phone ?? null,
  };
}

function mapAdminBusiness(row: AdminBusinessJoinRow): AdminBusinessSummary {
  const owner = firstJoin(row.profiles);
  return {
    id: String(row.id),
    name: row.name ?? '',
    category: row.category ?? '',
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? '',
    city: row.city ?? '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    logoUrl: row.logo_url ?? null,
    workingHours: row.working_hours ?? '',
    ownerName: owner?.full_name ?? null,
    ownerEmail: owner?.email ?? null,
    ownerPhone: owner?.phone ?? null,
    approvedAt: row.approved_at ?? null,
    isActive: row.is_active !== false,
    status: row.status ?? 'inactive',
    adminHidden: row.admin_hidden === true,
    adminHiddenReason: row.admin_hidden_reason ?? null,
    adminHiddenAt: row.admin_hidden_at ?? null,
  };
}

function mapRpcError(error: unknown): SubscriptionError {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : error instanceof Error
        ? error.message
        : '';
  const lower = message.toLowerCase();
  if (lower.includes('proof_required')) {
    return new SubscriptionError(
      'proof_required',
      'Please upload a clear screenshot of your payment receipt.',
    );
  }
  if (lower.includes('payment_already_pending')) {
    return new SubscriptionError(
      'already_pending',
      'A payment is already waiting for review.',
    );
  }
  if (lower.includes('already_active')) {
    return new SubscriptionError(
      'already_active',
      'Your business is already live on MeriBaari.',
    );
  }
  if (lower.includes('payment_cooldown')) {
    const dateMatch = message.match(/PAYMENT_COOLDOWN:(\d{4}-\d{2}-\d{2})/i);
    return new SubscriptionError(
      'renewal_cooldown',
      dateMatch?.[1]
        ? `You can submit the next subscription payment on ${dateMatch[1]}, 31 days after the last admin approval.`
        : 'You can submit the next subscription payment 31 days after the last admin approval.',
    );
  }
  if (lower.includes('visibility_reason_required')) {
    return new SubscriptionError(
      'invalid_data',
      'Please provide a reason for hiding this business.',
    );
  }
  if (lower.includes('rejection_reason_required')) {
    return new SubscriptionError(
      'invalid_data',
      'Please provide a reason for rejecting this payment.',
    );
  }
  if (lower.includes('forbidden') || lower.includes('unauthorized')) {
    return new SubscriptionError('forbidden', 'You do not have permission to do that.');
  }
  return toSubscriptionError(error);
}

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  async getLatestForOrganization(
    organizationId: string,
  ): Promise<SubscriptionPayment | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data
        ? mapSubscriptionPaymentRow(data as SubscriptionPaymentRow)
        : null;
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }

  async listForOrganization(
    organizationId: string,
  ): Promise<SubscriptionPayment[]> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) =>
        mapSubscriptionPaymentRow(row as SubscriptionPaymentRow),
      );
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }

  async submitPayment(input: {
    organizationId: string;
    paymentMethod: SubscriptionPaymentMethod;
    paymentProofPath: string;
    amount: number;
    currency?: string;
  }): Promise<string> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('submit_subscription_payment', {
        p_organization_id: input.organizationId,
        p_payment_method: input.paymentMethod,
        p_payment_proof_path: input.paymentProofPath,
        p_amount: input.amount,
        p_currency: input.currency ?? 'PKR',
      });
      if (error) throw error;
      if (!data) {
        throw new SubscriptionError('unknown', 'Could not submit payment.');
      }
      return String(data);
    } catch (e) {
      throw mapRpcError(e);
    }
  }

  async listAdminPayments(
    status: SubscriptionPaymentStatus | 'all' = 'all',
  ): Promise<SubscriptionPayment[]> {
    const supabase = requireSupabase();
    try {
      let builder = supabase
        .from('subscription_payments')
        .select(ADMIN_PAYMENT_SELECT)
        .order('submitted_at', { ascending: false });

      if (status !== 'all') {
        builder = builder.eq('status', status);
      }

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []).map((row) => mapJoinedPayment(row as PaymentJoinRow));
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }

  async getAdminPayment(
    paymentId: string,
  ): Promise<SubscriptionPaymentReview | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select(ADMIN_PAYMENT_SELECT)
        .eq('id', paymentId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const row = data as PaymentJoinRow;
      const payment = mapJoinedPayment(row);
      const org = firstJoin(row.organizations);
      const owner = firstJoin(row.profiles);
      const proofSignedUrl = await this.createProofSignedUrl(
        payment.paymentProofPath,
      );

      return {
        ...payment,
        organizationName: org?.name ?? payment.organizationName ?? '',
        organizationCategory: org?.category ?? '',
        organizationPhone: org?.phone ?? null,
        organizationAddress: org?.address ?? '',
        organizationCity: org?.city ?? '',
        organizationLatitude: org?.latitude ?? null,
        organizationLongitude: org?.longitude ?? null,
        organizationLogoUrl: org?.logo_url ?? null,
        ownerName: owner?.full_name ?? payment.ownerName ?? null,
        ownerEmail: owner?.email ?? payment.ownerEmail ?? null,
        ownerPhone: owner?.phone ?? payment.ownerPhone ?? null,
        services: [],
        proofSignedUrl,
      };
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }

  async getAdminStats(): Promise<AdminSubscriptionStats> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('get_admin_subscription_stats');
      if (error) throw error;
      const raw = (data ?? {}) as Record<string, unknown>;
      return {
        pendingPayments: Number(raw.pendingPayments ?? 0),
        approvedPayments: Number(raw.approvedPayments ?? 0),
        rejectedPayments: Number(raw.rejectedPayments ?? 0),
        activeBusinesses: Number(raw.activeBusinesses ?? 0),
      };
    } catch (e) {
      throw mapRpcError(e);
    }
  }

  async listAdminActiveBusinesses(): Promise<AdminBusinessSummary[]> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(ADMIN_BUSINESS_SELECT)
        .eq('subscription_status', 'active')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) =>
        mapAdminBusiness(row as AdminBusinessJoinRow),
      );
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }

  async getAdminBusiness(
    organizationId: string,
  ): Promise<AdminBusinessSummary | null> {
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(ADMIN_BUSINESS_SELECT)
        .eq('id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapAdminBusiness(data as AdminBusinessJoinRow) : null;
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }

  async reviewPayment(
    paymentId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.rpc('review_subscription_payment', {
        p_payment_id: paymentId,
        p_action: action,
        p_rejection_reason: rejectionReason ?? null,
      });
      if (error) throw error;
    } catch (e) {
      throw mapRpcError(e);
    }
  }

  async setAdminVisibility(
    organizationId: string,
    visible: boolean,
    reason?: string,
  ): Promise<void> {
    const supabase = requireSupabase();
    try {
      const { error } = await supabase.rpc('set_organization_admin_visibility', {
        p_organization_id: organizationId,
        p_visible: visible,
        p_reason: reason ?? null,
      });
      if (error) throw error;
    } catch (e) {
      throw mapRpcError(e);
    }
  }

  async createProofSignedUrl(path: string): Promise<string | null> {
    if (!path) return null;
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(path, 60 * 10);
      if (error) throw error;
      return data.signedUrl ?? null;
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }
}
