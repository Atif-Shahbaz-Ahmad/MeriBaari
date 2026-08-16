import { PAYMENT_CONFIG } from '@/config/payment';
import type {
  AdminBusinessSummary,
  AdminSubscriptionStats,
  SubscriptionPayment,
  SubscriptionPaymentMethod,
  SubscriptionPaymentReview,
  SubscriptionPaymentStatus,
} from '@/domain/models/subscription';
import type { SubscriptionRepository } from '@/domain/repositories/subscription.repository';
import { SubscriptionError } from '@/domain/errors/subscription-error';
import type { MockOrganizationRepository } from '@/data/mock/mock-organization.repository';
import { MOCK_ORGANIZATIONS } from '@/mock/organizations';

function toAdminBusiness(org: (typeof MOCK_ORGANIZATIONS)[number]): AdminBusinessSummary {
  return {
    id: org.id,
    name: org.name,
    category: org.category,
    phone: org.phone ?? null,
    email: org.email ?? null,
    address: org.address,
    city: org.city,
    latitude: null,
    longitude: null,
    logoUrl: org.logoUrl ?? null,
    workingHours: org.workingHours,
    ownerName: null,
    ownerEmail: null,
    ownerPhone: null,
    approvedAt: null,
    isActive: org.isActive !== false,
    status: org.status ?? 'active',
    adminHidden: false,
    adminHiddenReason: null,
    adminHiddenAt: null,
  };
}

/**
 * In-memory subscription payments when Supabase is not configured.
 */
export class MockSubscriptionRepository implements SubscriptionRepository {
  private payments: SubscriptionPayment[] = [];

  constructor(private readonly organizations?: MockOrganizationRepository) {}

  async getLatestForOrganization(
    organizationId: string,
  ): Promise<SubscriptionPayment | null> {
    return (
      this.payments
        .filter((p) => p.organizationId === organizationId)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] ?? null
    );
  }

  async listForOrganization(
    organizationId: string,
  ): Promise<SubscriptionPayment[]> {
    return this.payments
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  async submitPayment(input: {
    organizationId: string;
    paymentMethod: SubscriptionPaymentMethod;
    paymentProofPath: string;
    amount: number;
    currency?: string;
  }): Promise<string> {
    const pending = this.payments.find(
      (p) => p.organizationId === input.organizationId && p.status === 'pending',
    );
    if (pending) {
      throw new SubscriptionError(
        'already_pending',
        'A payment is already waiting for review.',
      );
    }
    const mine = await this.organizations?.getMyOrganization();
    const lastApproved =
      this.payments.find(
        (p) =>
          p.organizationId === input.organizationId && p.status === 'approved',
      )?.reviewedAt ?? mine?.approvedAt ?? null;
    if (
      lastApproved &&
      Date.now() <
        new Date(lastApproved).getTime() +
          PAYMENT_CONFIG.renewalCooldownDays * 24 * 60 * 60 * 1000
    ) {
      throw new SubscriptionError(
        'renewal_cooldown',
        'You can submit the next subscription payment 31 days after the last admin approval.',
      );
    }
    const now = new Date().toISOString();
    const payment: SubscriptionPayment = {
      id: `pay-mock-${Date.now()}`,
      organizationId: input.organizationId,
      userId: 'demo-business-1',
      amount: input.amount || PAYMENT_CONFIG.monthlySubscriptionPrice,
      currency: input.currency ?? PAYMENT_CONFIG.currency,
      paymentMethod: input.paymentMethod,
      paymentProofPath: input.paymentProofPath,
      status: 'pending',
      submittedAt: now,
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      organizationName: 'My Business',
      ownerName: 'Business Owner',
    };
    this.payments.unshift(payment);
    if (mine?.subscriptionStatus !== 'active') {
      this.organizations?.applySubscriptionStatus('pending_approval', {
        subscriptionSubmittedAt: now,
        paymentRejectionReason: null,
      });
    }
    return payment.id;
  }

  async listAdminPayments(
    status: SubscriptionPaymentStatus | 'all' = 'all',
  ): Promise<SubscriptionPayment[]> {
    return this.payments.filter((p) => status === 'all' || p.status === status);
  }

  async getAdminPayment(
    paymentId: string,
  ): Promise<SubscriptionPaymentReview | null> {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) return null;
    return {
      ...payment,
      organizationName: payment.organizationName ?? 'My Business',
      organizationCategory: 'other',
      organizationPhone: null,
      organizationAddress: '',
      organizationCity: '',
      organizationLatitude: null,
      organizationLongitude: null,
      organizationLogoUrl: null,
      ownerName: payment.ownerName ?? 'Business Owner',
      ownerEmail: null,
      ownerPhone: null,
      services: [],
      proofSignedUrl: payment.paymentProofPath,
    };
  }

  async getAdminStats(): Promise<AdminSubscriptionStats> {
    return {
      pendingPayments: this.payments.filter((p) => p.status === 'pending').length,
      approvedPayments: this.payments.filter((p) => p.status === 'approved').length,
      rejectedPayments: this.payments.filter((p) => p.status === 'rejected').length,
      activeBusinesses: this.payments.filter((p) => p.status === 'approved').length,
    };
  }

  async listAdminActiveBusinesses(): Promise<AdminBusinessSummary[]> {
    return MOCK_ORGANIZATIONS.filter((org) => org.isActive !== false).map(
      toAdminBusiness,
    );
  }

  async getAdminBusiness(
    organizationId: string,
  ): Promise<AdminBusinessSummary | null> {
    const org = MOCK_ORGANIZATIONS.find((item) => item.id === organizationId);
    return org ? toAdminBusiness(org) : null;
  }

  async reviewPayment(
    paymentId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ): Promise<void> {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new SubscriptionError('not_found', 'Payment record not found.');
    }
    const now = new Date().toISOString();
    if (action === 'approve') {
      payment.status = 'approved';
      payment.reviewedAt = now;
      payment.reviewedBy = 'demo-admin-1';
      payment.rejectionReason = null;
      this.organizations?.applySubscriptionStatus('active', {
        approvedAt: now,
        approvedBy: 'demo-admin-1',
        paymentRejectionReason: null,
      });
    } else {
      const reason = rejectionReason?.trim();
      if (!reason) {
        throw new SubscriptionError(
          'invalid_data',
          'Please provide a reason for rejecting this payment.',
        );
      }
      payment.status = 'rejected';
      payment.reviewedAt = now;
      payment.reviewedBy = 'demo-admin-1';
      payment.rejectionReason = reason;
      const mine = await this.organizations?.getMyOrganization();
      if (mine?.subscriptionStatus !== 'active') {
        this.organizations?.applySubscriptionStatus('rejected', {
          paymentRejectionReason: reason,
        });
      }
    }
    payment.updatedAt = now;
  }

  async setAdminVisibility(
    organizationId: string,
    visible: boolean,
    reason?: string,
  ): Promise<void> {
    if (!visible && !reason?.trim()) {
      throw new SubscriptionError(
        'invalid_data',
        'Please provide a reason for hiding this business.',
      );
    }
    this.organizations?.applyAdminVisibility(organizationId, visible, reason);
  }

  async createProofSignedUrl(path: string): Promise<string | null> {
    return path || null;
  }
}
