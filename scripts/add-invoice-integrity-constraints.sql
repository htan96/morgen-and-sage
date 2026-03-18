-- Recommended database constraints for invoice integrity
-- Run in Supabase SQL Editor after reviewing
--
-- Prevents:
-- 1. Duplicate non-void invoices per tenant/month/type
-- 2. Duplicate line items for same booking on same invoice (optional)

-- =============================================================================
-- 1. Unique active invoice per tenant + billing_month + invoice_type
--    Allows one draft/partial/paid per tenant/month; voided invoices excluded
--    via partial index (only non-void).
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS invoices_one_active_per_tenant_month_type
ON invoices (tenant_id, billing_month, invoice_type)
WHERE status != 'void';

-- =============================================================================
-- 2. Optional: Prevent duplicate line items for same booking on same invoice
--    Use if booking_id is populated for booking-based line items.
--    COALESCE handles null booking_id (monthly services).
-- =============================================================================

-- Uncomment if you want to enforce at DB level:
/*
CREATE UNIQUE INDEX IF NOT EXISTS invoice_line_items_no_duplicate_booking
ON invoice_line_items (invoice_id, COALESCE(booking_id::text, ''), description, COALESCE(service_date::text, ''))
WHERE booking_id IS NOT NULL;
*/
