import { createClient } from "@/lib/supabase/server";
import { generatePresetBookingsForMonth } from "./generatePresetBookingsForMonth";
import {
  attachBookingsToInvoiceForMonth,
} from "@/lib/db/bookings";
import {
  insertInvoice,
  insertInvoiceLineItems,
} from "@/lib/db/invoices";
import { getActiveHourlyRate } from "@/lib/db/tenantServices";

function getMonthBounds(billingMonth: string) {
  const start = new Date(`${billingMonth}T00:00:00.000Z`);
  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);

  return {
    startISO: start.toISOString(),
    nextISO: next.toISOString(),
  };
}

function generateInvoiceNumber() {
  return `INV-${Date.now()}`;
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

  // Prevent duplicates
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("billing_month", billingMonth)
    .eq("invoice_type", "preset")
    .maybeSingle();

  if (existingInvoice) {
    return {
      success: false,
      reason: "INVOICE_ALREADY_EXISTS",
      invoiceId: existingInvoice.id,
    };
  }

  // Get tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("organization_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    return { success: false, reason: "TENANT_NOT_FOUND" };
  }

  const { startISO, nextISO } = getMonthBounds(billingMonth);

  // Generate bookings
  await generatePresetBookingsForMonth(tenantId, billingMonth);

  // Fetch bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_time, total_hours")
    .eq("tenant_id", tenantId)
    .gte("start_time", startISO)
    .lt("start_time", nextISO)
    .is("invoice_id", null);

  if (!bookings || bookings.length === 0) {
    return { success: false, reason: "NOTHING_TO_BILL" };
  }

  const hourlyRate = await getActiveHourlyRate(tenantId);

  if (!hourlyRate) {
    return { success: false, reason: "NO_HOURLY_RATE" };
  }

  let subtotal = 0;

  const lineItems = bookings.map((booking) => {

    const hours = Number(booking.total_hours || 0);
    const amount = hours * hourlyRate;

    subtotal += amount;

    return {
      description: "Kitchen Time",
      quantity: hours,
      rate: hourlyRate,
      amount,
      serviceDate: booking.start_time,
    };
  });

  const invoice = await insertInvoice({
    organizationId: tenant.organization_id,
    tenantId,
    invoiceType: "preset",
    billingMonth,
    generatedByType,
    generatedById,
    invoiceNumber: generateInvoiceNumber(),
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
    lineItems
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