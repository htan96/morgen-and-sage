import { createClient } from "@/lib/supabase/server";
import { getActiveMonthlyServices } from "@/lib/db/tenantServices";
import {
  insertInvoice,
  replaceInvoiceLineItems,
  updateInvoiceTotals,
} from "@/lib/db/invoices";

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

export async function runCommissaryMonthlyEngine(params: {
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

  const { data: existingInvoices, error: existingErr } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("billing_month", billingMonth)
    .eq("invoice_type", "commissary")
    .order("invoice_date", { ascending: false })
    .order("id", { ascending: false });

  if (existingErr) throw existingErr;

  const hasActiveInvoice =
    existingInvoices?.some((i) => i.status !== "void");

  if (hasActiveInvoice) {
    return {
      success: false,
      reason: "INVOICE_ALREADY_EXISTS",
    };
  }

  const voidedInvoice = existingInvoices?.find((i) => i.status === "void");

  /* ---------------------------------- */
  /* Get tenant                         */
  /* ---------------------------------- */

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("organization_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) throw error;

  if (!tenant) {
    return { success: false, reason: "TENANT_NOT_FOUND" };
  }

  /* ---------------------------------- */
  /* Get active monthly services        */
  /* ---------------------------------- */

  const monthlyServices = await getActiveMonthlyServices(tenantId);

  if (!monthlyServices.length) {
    return { success: false, reason: "NOTHING_TO_BILL" };
  }

  let subtotal = 0;
  const lineItems: any[] = [];

  for (const service of monthlyServices) {

    const total =
      Number(service.amount || 0) *
      Number(service.quantity || 0);

    if (total <= 0) continue;

    subtotal += total;

    lineItems.push({
      description: service.name,
      quantity: Number(service.quantity),
      rate: Number(service.amount),
      amount: total,
      serviceDate: billingMonth,
    });
  }

  if (subtotal <= 0) {
    return { success: false, reason: "NOTHING_TO_BILL" };
  }

  /* ---------------------------------- */
  /* Reuse voided invoice OR create new */
  /* Prevents duplicate invoices & line items */
  /* ---------------------------------- */

  let invoiceId: string;

  if (voidedInvoice) {
    invoiceId = voidedInvoice.id;

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
      invoiceType: "commissary",
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
    lineItems
  );

  return {
    success: true,
    invoiceId,
  };
}