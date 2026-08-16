import { PAYMENT_CONFIG } from '@/config/payment';
import {
  SubscriptionError,
  toSubscriptionError,
} from '@/domain/errors/subscription-error';
import type { FileStorageService } from '@/domain/future';
import type {
  SubmitSubscriptionPaymentInput,
  SubscriptionPaymentStatus,
} from '@/domain/models/subscription';
import {
  isSubscriptionPaymentOnCooldown,
  lastSubscriptionApprovalAt,
} from '@/domain/models/subscription';
import type { OrganizationRepository } from '@/domain/repositories';
import type { SubscriptionRepository } from '@/domain/repositories/subscription.repository';

export class SubscriptionService {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly organizations: OrganizationRepository,
    private readonly files: FileStorageService,
  ) {}

  getLatestForOrganization(organizationId: string) {
    return this.subscriptions.getLatestForOrganization(organizationId);
  }

  listForOrganization(organizationId: string) {
    return this.subscriptions.listForOrganization(organizationId);
  }

  async submitPayment(input: SubmitSubscriptionPaymentInput): Promise<string> {
    if (!input.localProofUri) {
      throw new SubscriptionError(
        'proof_required',
        'Please upload a clear screenshot of your payment receipt.',
      );
    }
    if (!input.organizationId) {
      throw new SubscriptionError('invalid_data', 'Organization is required.');
    }

    const mine = await this.organizations.getMyOrganization();
    if (!mine || mine.id !== input.organizationId) {
      throw new SubscriptionError(
        'forbidden',
        'You can only submit payment for your own business.',
      );
    }
    if (mine.subscriptionStatus === 'pending_approval') {
      throw new SubscriptionError(
        'already_pending',
        'A payment is already waiting for review.',
      );
    }

    const latest = await this.subscriptions.getLatestForOrganization(
      input.organizationId,
    );
    if (latest?.status === 'pending') {
      throw new SubscriptionError(
        'already_pending',
        'A payment is already waiting for review.',
      );
    }

    const lastApprovedAt = lastSubscriptionApprovalAt(
      latest,
      mine.approvedAt,
    );
    if (
      isSubscriptionPaymentOnCooldown(
        lastApprovedAt,
        PAYMENT_CONFIG.renewalCooldownDays,
      )
    ) {
      throw new SubscriptionError(
        'renewal_cooldown',
        'You can submit the next subscription payment 31 days after the last admin approval.',
      );
    }

    const userId = mine.ownerId;
    if (!userId) {
      throw new SubscriptionError('unauthorized', 'Please sign in to continue.');
    }

    let proofPath: string;
    try {
      proofPath = await this.files.uploadPaymentProof(
        userId,
        input.localProofUri,
      );
    } catch (e) {
      throw toSubscriptionError(e);
    }

    try {
      return await this.subscriptions.submitPayment({
        organizationId: input.organizationId,
        paymentMethod: input.paymentMethod,
        paymentProofPath: proofPath,
        amount: input.amount || PAYMENT_CONFIG.monthlySubscriptionPrice,
        currency: input.currency ?? PAYMENT_CONFIG.currency,
      });
    } catch (e) {
      throw toSubscriptionError(e);
    }
  }

  listAdminPayments(status?: SubscriptionPaymentStatus | 'all') {
    return this.subscriptions.listAdminPayments(status);
  }

  async getAdminPayment(paymentId: string) {
    const payment = await this.subscriptions.getAdminPayment(paymentId);
    if (!payment) return null;
    if (payment.proofSignedUrl) return payment;
    const url = await this.subscriptions.createProofSignedUrl(
      payment.paymentProofPath,
    );
    return { ...payment, proofSignedUrl: url };
  }

  getAdminStats() {
    return this.subscriptions.getAdminStats();
  }

  listAdminActiveBusinesses() {
    return this.subscriptions.listAdminActiveBusinesses();
  }

  getAdminBusiness(organizationId: string) {
    return this.subscriptions.getAdminBusiness(organizationId);
  }

  async approvePayment(paymentId: string) {
    await this.subscriptions.reviewPayment(paymentId, 'approve');
  }

  async rejectPayment(paymentId: string, reason: string) {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new SubscriptionError(
        'invalid_data',
        'Please provide a reason for rejecting this payment.',
      );
    }
    await this.subscriptions.reviewPayment(paymentId, 'reject', trimmed);
  }

  async setAdminVisibility(
    organizationId: string,
    visible: boolean,
    reason?: string,
  ) {
    if (!organizationId) {
      throw new SubscriptionError('invalid_data', 'Organization is required.');
    }
    if (!visible && !reason?.trim()) {
      throw new SubscriptionError(
        'invalid_data',
        'Please provide a reason for hiding this business.',
      );
    }
    await this.subscriptions.setAdminVisibility(
      organizationId,
      visible,
      reason?.trim(),
    );
  }

  createProofSignedUrl(path: string) {
    return this.subscriptions.createProofSignedUrl(path);
  }
}
