import { createClient } from "@/lib/supabase/server";
import { getActiveMonthlyServices } from "@/lib/db/tenantServices";
import { insertInvoice, insertInvoiceLineItems } from "@/lib/db/invoices";

function generateInvoiceNumber() {
  return `INV-${Date.now()}`;
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

  // 🔎 1️⃣ Prevent duplicate invoices
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("billing_month", billingMonth)
    .eq("invoice_type", "commissary")
    .maybeSingle();

  if (existingInvoice) {
    return {
      success: false,
      reason: "INVOICE_ALREADY_EXISTS",
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

  // 🔎 3️⃣ Get active monthly services
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

  // 🧾 4️⃣ Create invoice
  const invoice = await insertInvoice({
    organizationId: tenant.organization_id,
    tenantId,
    invoiceType: "commissary",
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

  // 🧾 5️⃣ Insert line items
  await insertInvoiceLineItems(
    invoice.id,
    tenant.organization_id,
    tenantId,
    lineItems
  );

  return { success: true, invoiceId: invoice.id };
}