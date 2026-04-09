import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

/**
 * Sum total booking value for uninvoiced bookings in a given month.
 * Uses:
 *  - bookings.total_hours
 *  - tenant_services hourly rate
 */
export async function sumUninvoicedBookingTotalForMonth(
  tenantId: string,
  monthStartISO: string,
  nextMonthStartISO: string
) {
  const supabase = await createClient();

  // 1️⃣ Get uninvoiced bookings for month
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("total_hours")
    .eq("tenant_id", tenantId)
    .is("invoice_id", null)
    .gte("start_time", monthStartISO)
    .lt("start_time", nextMonthStartISO);

  if (error) throw error;

  const totalHours =
    bookings?.reduce(
      (sum: number, b: any) => sum + (b.total_hours || 0),
      0
    ) || 0;

  if (totalHours === 0) return 0;

  // 2️⃣ Get hourly rate from tenant_services
  const { data: rateRow, error: rateError } = await supabase
    .from("tenant_services")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("frequency", "hourly")
    .eq("is_active", true)
    .maybeSingle();

  if (rateError) throw rateError;

  const hourlyRate = rateRow?.amount || 0;

  return totalHours * hourlyRate;
}

/**
 * Attach bookings to invoice after billing
 * Prevents double billing
 */
export async function attachBookingsToInvoiceForMonth(
  tenantId: string,
  invoiceId: string,
  monthStartISO: string,
  nextMonthStartISO: string
) {
  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ invoice_id: invoiceId })
    .eq("tenant_id", tenantId)
    .is("invoice_id", null)
    .gte("start_time", monthStartISO)
    .lt("start_time", nextMonthStartISO);

  if (error) throw error;
}

/**
 * Optional helper if you ever need raw hours for reporting
 */
export async function sumUninvoicedBookingHoursForMonth(
  tenantId: string,
  monthStartISO: string,
  nextMonthStartISO: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("total_hours")
    .eq("tenant_id", tenantId)
    .is("invoice_id", null)
    .gte("start_time", monthStartISO)
    .lt("start_time", nextMonthStartISO);

  if (error) throw error;

  return (
    data?.reduce(
      (sum: number, b: any) => sum + (b.total_hours || 0),
      0
    ) || 0
  );
}