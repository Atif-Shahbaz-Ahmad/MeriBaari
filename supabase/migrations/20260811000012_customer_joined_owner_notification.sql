-- migrate:no-transaction
-- =============================================================================
-- MeriBaari — Business-owner notification on customer queue join
-- Step 1: Add CUSTOMER_JOINED to the notification_type enum.
-- Must run outside a transaction (ALTER TYPE ... ADD VALUE requirement).
-- Functions that reference this value are in the next migration (20260811000013).
-- =============================================================================

alter type public.notification_type add value if not exists 'CUSTOMER_JOINED';
