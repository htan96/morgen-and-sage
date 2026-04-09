import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { generatePresetBookingsForMonth } from "./generatePresetBookingsForMonth";
import { attachBookingsToInvoiceForMonth } from "@/lib/db/bookings";
import {
  insertInvoice,
  replaceInvoiceLineItems,
  updateInvoiceTotals,
} from "@/lib/db/invoices";
import {
  getActiveHourlyRate,
  getActiveMonthlyServices,
  getActivePerBookingServices,
} from "@/lib/db/tenantServices";

/* ---------------------------------- */
/* Get Month Bounds                   */
/* ---------------------------------- */

function getMonthBounds(billingMonth: string) {

  const start = new Date(`${billingMonth}T00:00:00.000Z`);
  const next = new Date(start);

  next.setUTCMonth(next.getUTCMonth() + 1);

  return {
    startISO: start.toISOString(),
    nextISO: next.toISOString(),
  };
}

/* ---------------------------------- */
/* Generate Invoice Number            */
/* ---------------------------------- */

function generateInvoiceNumber(billingMonth: string) {

  const month = new Date(`${billingMonth}T00:00:00Z`)
    .toLocaleString("en-US", { month: "short", year: "numeric" })
    .replace(" ", "")
    .toUpperCase();

  const random = Math.floor(1000 + Math.random() * 9000);

  return `INV-${month}-${random}`;
}

/* ---------------------------------- */
/* Run Preset Monthly Engine          */
/* ---------------------------------- */

export async function runPresetMonthlyEngine(params: {
  tenantId: string;
  billingMonth: string;
  generatedByType?: "admin" | "system" | "tenant";
  generatedById?: string | null;
}) {

  const {
    tenantId,
    billingMonth,
    generatedByType = "system",
    generatedById = null,
  } = params;

  const supabase = supabaseAdmin;

  /* ---------------------------------- */
  /* Prevent duplicate active invoices  */
  /* Allow regeneration if VOID         */
  /* ---------------------------------- */

  const { data: activeRow, error: activeErr } = await supabase
    .from("invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("billing_month", billingMonth)
    .eq("invoice_type", "preset")
    .neq("status", "void")
    .maybeSingle();

  if (activeErr) throw activeErr;

  if (activeRow) {
    return {
      success: false,
      reason: "INVOICE_ALREADY_EXISTS",
      invoiceId: activeRow.id,
    };
  }

  const { data: voidRows, error: voidErr } = await supabase
    .from("invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("billing_month", billingMonth)
    .eq("invoice_type", "preset")
    .eq("status", "void")
    .order("invoice_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(1);

  if (voidErr) throw voidErr;

  const voidInvoiceId = voidRows?.[0]?.id ?? null;

  /* ---------------------------------- */
  /* Get tenant                         */
  /* ---------------------------------- */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("organization_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    return { success: false, reason: "TENANT_NOT_FOUND" };
  }

  if (!tenant.organization_id) {
    return { success: false, reason: "TENANT_MISSING_ORGANIZATION" };
  }

  const { startISO, nextISO } = getMonthBounds(billingMonth);

  /* ---------------------------------- */
  /* 🔧 FIX: Detach bookings from old invoice */
  /* Allows regeneration after VOID     */
  /* ---------------------------------- */

  const { error: detachErr } = await supabaseAdmin
    .from("bookings")
    .update({ invoice_id: null })
    .eq("tenant_id", tenantId)
    .gte("start_time", startISO)
    .lt("start_time", nextISO);

  if (detachErr) throw detachErr;

  /* ---------------------------------- */
  /* Drop auto-generated preset slots   */
  /* Prevents duplicate rows after void */
  /* + regenerate (time drift / re-run) */
  /* ---------------------------------- */

  const { error: delPresetBookingsErr } = await supabaseAdmin
    .from("bookings")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("submitted_via", "preset")
    .gte("start_time", startISO)
    .lt("start_time", nextISO);

  if (delPresetBookingsErr) throw delPresetBookingsErr;

  /* ---------------------------------- */
  /* Generate preset bookings           */
  /* ---------------------------------- */

  await generatePresetBookingsForMonth(tenantId, billingMonth);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_time, total_hours")
    .eq("tenant_id", tenantId)
    .gte("start_time", startISO)
    .lt("start_time", nextISO)
    .is("invoice_id", null)
    .order("start_time", { ascending: true });

  if (!bookings || bookings.length === 0) {
    return { success: false, reason: "NOTHING_TO_BILL" };
  }

  /* ---------------------------------- */
  /* Load services                      */
  /* ---------------------------------- */

  const hourlyRate = await getActiveHourlyRate(tenantId);
  const perBookingServices = await getActivePerBookingServices(tenantId);
  const monthlyServices = await getActiveMonthlyServices(tenantId);

  if (!hourlyRate) {
    return { success: false, reason: "NO_HOURLY_RATE" };
  }

  let subtotal = 0;

  const lineItems: any[] = [];

  /* ---------------------------------- */
  /* Kitchen Time                       */
  /* ---------------------------------- */

  for (const booking of bookings) {

    const hours = Number(booking.total_hours || 0);
    const amount = hours * hourlyRate;

    subtotal += amount;

    lineItems.push({
      sortOrder: 1,
      description: "Kitchen Time",
      quantity: hours,
      rate: hourlyRate,
      amount,
      serviceDate: booking.start_time,
      bookingId: booking.id,
    });
  }

  /* ---------------------------------- */
  /* Per Booking Services               */
  /* ---------------------------------- */

  for (const service of perBookingServices) {

    const total =
      bookings.length *
      Number(service.amount) *
      Number(service.quantity || 1);

    if (total <= 0) continue;

    subtotal += total;

    lineItems.push({
      sortOrder: 2,
      description: service.name,
      quantity: bookings.length * Number(service.quantity || 1),
      rate: Number(service.amount),
      amount: total,
      serviceDate: billingMonth,
    });
  }

  /* ---------------------------------- */
  /* Monthly Services                   */
  /* ---------------------------------- */

  for (const service of monthlyServices) {

    const total =
      Number(service.amount) *
      Number(service.quantity || 1);

    if (total <= 0) continue;

    subtotal += total;

    lineItems.push({
      sortOrder: 3,
      description: service.name,
      quantity: Number(service.quantity || 1),
      rate: Number(service.amount),
      amount: total,
      serviceDate: billingMonth,
    });
  }

  /* ---------------------------------- */
  /* Sort invoice items                 */
  /* ---------------------------------- */

  const sortedLineItems = lineItems
    .sort((a, b) => {

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      if (!a.serviceDate) return 1;
      if (!b.serviceDate) return -1;

      return (
        new Date(a.serviceDate).getTime() -
        new Date(b.serviceDate).getTime()
      );
    })
    .map(({ sortOrder, ...item }) => item);

  /* ---------------------------------- */
  /* Reuse voided invoice OR create new */
  /* Prevents duplicate invoices & line items */
  /* ---------------------------------- */

  let invoiceId: string;

  if (voidInvoiceId) {
    invoiceId = voidInvoiceId;

    await updateInvoiceTotals(invoiceId, {
      subtotal,
      total_amount: subtotal,
      balance_due: subtotal,
      status: "draft",
    });
  } else {
    const invoice = await insertInvoice({
      organizationId: tenant.organization_id,
      tenantId,
      invoiceType: "preset",
      billingMonth,
      generatedByType,
      generatedById,
      invoiceNumber: generateInvoiceNumber(billingMonth),
      invoiceDate: new Date(),
      dueDate: new Date(),
      subtotal,
      tax: 0,
      totalAmount: subtotal,
      balanceDue: subtotal,
      status: "draft",
    });
    invoiceId = invoice.id;
  }

  /* ---------------------------------- */
  /* Line items (always replace)        */
  /* ---------------------------------- */

  await replaceInvoiceLineItems(
    invoiceId,
    tenant.organization_id,
    tenantId,
    sortedLineItems
  );

  /* ---------------------------------- */
  /* Attach bookings to invoice         */
  /* ---------------------------------- */

  await attachBookingsToInvoiceForMonth(
    tenantId,
    invoiceId,
    startISO,
    nextISO
  );

  return {
    success: true,
    invoiceId,
  };
}