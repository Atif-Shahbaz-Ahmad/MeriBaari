import type { ReplyStyle } from '../_shared/chatbot/reply-style.ts';
import type { OwnedOrganization, ToolContext } from './types.ts';

type OrgRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: string | null;
  phone: string | null;
  is_active: boolean;
  status: string;
  subscription_status: string;
  approved_at: string | null;
  payment_rejection_reason: string | null;
  admin_hidden: boolean;
};

export function mapOwnedOrganization(row: OrgRow): OwnedOrganization {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    category: row.category ?? 'other',
    address: row.address ?? '',
    city: row.city ?? '',
    latitude: typeof row.latitude === 'number' ? row.latitude : null,
    longitude: typeof row.longitude === 'number' ? row.longitude : null,
    workingHours: row.working_hours ?? '',
    phone: row.phone ?? null,
    isActive: row.is_active === true,
    status: row.status,
    subscriptionStatus: row.subscription_status,
    approvedAt: row.approved_at,
    paymentRejectionReason: row.payment_rejection_reason,
    adminHidden: row.admin_hidden === true,
  };
}

/**
 * Resolve organizations owned by the authenticated user.
 * Never trusts a client-supplied organization id.
 */
export async function resolveOwnedOrganizations(
  ctx: Pick<ToolContext, 'supabase' | 'userId'>,
): Promise<OwnedOrganization[]> {
  const { data, error } = await ctx.supabase
    .from('organizations')
    .select(
      'id, name, description, category, address, city, latitude, longitude, working_hours, phone, is_active, status, subscription_status, approved_at, payment_rejection_reason, admin_hidden',
    )
    .eq('owner_id', ctx.userId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as OrgRow[]).map(mapOwnedOrganization);
}

export function noOrganizationMessage(style: ReplyStyle): string {
  if (style === 'urdu_script') {
    return 'آپ کا ابھی کوئی کاروبار رجسٹرڈ نہیں ہے۔ پہلے میری باری میں اپنا کاروبار بنائیں۔';
  }
  if (style === 'roman_urdu') {
    return 'Aap ka abhi koi business registered nahi hai. Pehle MeriBaari mein apna business create karein.';
  }
  return 'You do not have a registered business yet. Create your business in MeriBaari first.';
}

export function requireOrg(
  ctx: ToolContext,
): { ok: true; org: OwnedOrganization } | { ok: false; result: Record<string, unknown> } {
  if (!ctx.org) {
    return {
      ok: false,
      result: {
        error: 'no_organization',
        message: noOrganizationMessage(ctx.replyStyle),
      },
    };
  }
  return { ok: true, org: ctx.org };
}

export async function loadOwnedQueue(
  ctx: ToolContext,
  queueId: string,
): Promise<{
  id: string;
  organization_id: string;
  department_id: string;
  service_id: string | null;
  status: string;
  total_waiting: number;
  current_number: string;
  current_serving_number: string;
  average_service_time: number;
  prefix: string;
} | null> {
  if (!ctx.org) return null;
  const { data, error } = await ctx.supabase
    .from('queues')
    .select(
      'id, organization_id, department_id, service_id, status, total_waiting, current_number, current_serving_number, average_service_time, prefix',
    )
    .eq('id', queueId)
    .eq('organization_id', ctx.org.id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export function mapQueueStatus(status: string): 'open' | 'paused' | 'closed' {
  const value = status.toLowerCase();
  if (value === 'paused') return 'paused';
  if (value === 'closed') return 'closed';
  return 'open';
}
