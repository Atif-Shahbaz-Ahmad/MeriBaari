-- migrate:no-transaction
-- =============================================================================
-- MeriBaari — Subscription notification types
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction.
-- Functions that reference these values are in 20260813000020.
-- =============================================================================

alter type public.notification_type add value if not exists 'SUBSCRIPTION_PAYMENT_SUBMITTED';
alter type public.notification_type add value if not exists 'SUBSCRIPTION_APPROVED';
alter type public.notification_type add value if not exists 'SUBSCRIPTION_REJECTED';
