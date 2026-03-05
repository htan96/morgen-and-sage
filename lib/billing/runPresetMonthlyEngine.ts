import { createClient } from "@/lib/supabase/server";
import { generatePresetBookingsForMonth } from "./generatePresetBookingsForMonth";
import { attachBookingsToInvoiceForMonth } from "@/lib/db/bookings";
import {
  insertInvoice,
  insertInvoiceLineItems,
} from "@/lib/db/invoices";
import {
  getActiveHourlyRate,
  getActiveMonthlyServices,
  getActivePerBookingServices,
} from "@/lib/db/tenantServices";

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

  const supabase = await createClient();

  /* ---------------------------------- */
  /* Prevent duplicate active invoices  */
  /* Allow regeneration if VOID         */
  /* ---------------------------------- */

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("billing_month", billingMonth)
    .eq("invoice_type", "preset")
    .maybeSingle();

  if (existingInvoice && existingInvoice.status !== "void") {
    return {
      success: false,
      reason: "INVOICE_ALREADY_EXISTS",
      invoiceId: existingInvoice.id,
    };
  }

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

  const { startISO, nextISO } = getMonthBounds(billingMonth);

  /* ---------------------------------- */
  /* Generate bookings                  */
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

      return new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime();
    })
    .map(({ sortOrder, ...item }) => item);

  /* ---------------------------------- */
  /* Create invoice                     */
  /* ---------------------------------- */

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

  await insertInvoiceLineItems(
    invoice.id,
    tenant.organization_id,
    tenantId,
    sortedLineItems
  );

  await attachBookingsToInvoiceForMonth(
    tenantId,
    invoice.id,
    startISO,
    nextISO
  );

  return {
    success: true,
    invoiceId: invoice.id,
  };
}