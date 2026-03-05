import { createClient } from "@/lib/supabase/server";
import { generatePresetBookingsForMonth } from "./generatePresetBookingsForMonth";
import {
  sumUninvoicedBookingTotalForMonth,
  attachBookingsToInvoiceForMonth,
} from "@/lib/db/bookings";
import {
  insertInvoice,
  insertInvoiceLineItems,
} from "@/lib/db/invoices";

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

  // 🔒 1️⃣ Prevent duplicate preset invoice
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

  // 🔎 2️⃣ Get tenant
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

  // 3️⃣ Generate preset bookings
  await generatePresetBookingsForMonth(tenantId, billingMonth);

  // 4️⃣ Calculate uninvoiced booking total
  const bookingTotal =
    await sumUninvoicedBookingTotalForMonth(
      tenantId,
      startISO,
      nextISO
    );

  if (bookingTotal <= 0) {
    return { success: false, reason: "NOTHING_TO_BILL" };
  }

  // 🧾 5️⃣ Create invoice
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
    subtotal: bookingTotal,
    tax: 0,
    totalAmount: bookingTotal,
    balanceDue: bookingTotal,
    status: "draft",
  });

  // 🧾 6️⃣ Create invoice line item
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

  // 🔗 7️⃣ Attach bookings
  await attachBookingsToInvoiceForMonth(
    tenantId,
    invoice.id,
    startISO,
    nextISO
  );

  return { success: true, invoiceId: invoice.id };
}