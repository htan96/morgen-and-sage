import { createClient } from "@/lib/supabase/server";
import { generatePresetBookingsForMonth } from "./generatePresetBookingsForMonth";
import { sumUninvoicedBookingTotalForMonth, attachBookingsToInvoiceForMonth } from "@/lib/db/bookings";
import { insertInvoice, insertInvoiceLineItems } from "@/lib/db/invoices";

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
}) {
  const { tenantId, billingMonth } = params;

  const supabase = await createClient();

const { data: tenant, error } = await supabase
  .from("tenants")
  .select("organization_id")
  .eq("id", tenantId)
  .maybeSingle();

if (error) throw error;

if (!tenant) {
  return { success: false, reason: "TENANT_NOT_FOUND" };
}

  const { startISO, nextISO } = getMonthBounds(billingMonth);

  // Generate preset bookings first
  await generatePresetBookingsForMonth(tenantId, billingMonth);

  const bookingTotal =
    await sumUninvoicedBookingTotalForMonth(
      tenantId,
      startISO,
      nextISO
    );

  if (bookingTotal <= 0) {
    return { success: false, reason: "NOTHING_TO_BILL" };
  }

  const invoice = await insertInvoice({
    organizationId: tenant.organization_id,
    tenantId,
    invoiceType: "preset",
    billingMonth,
    generatedByType: "system",
    generatedById: null,
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date(),
    dueDate: new Date(),
    subtotal: bookingTotal,
    tax: 0,
    totalAmount: bookingTotal,
    balanceDue: bookingTotal,
    status: "draft",
  });

  await insertInvoiceLineItems(
    invoice.id,
    tenant.organization_id,
    tenantId,
    [
      {
        description: "Kitchen Time",
        quantity: 1,
        rate: bookingTotal,
        amount: bookingTotal,
        serviceDate: billingMonth,
      },
    ]
  );

  await attachBookingsToInvoiceForMonth(
    tenantId,
    invoice.id,
    startISO,
    nextISO
  );

  return { success: true, invoiceId: invoice.id };
}