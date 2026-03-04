import { createClient } from "@/lib/supabase/server";
import { getActiveMonthlyServices } from "@/lib/db/tenantServices";
import { insertInvoice, insertInvoiceLineItems } from "@/lib/db/invoices";

function generateInvoiceNumber() {
  return `INV-${Date.now()}`;
}

export async function runCommissaryMonthlyEngine(params: {
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
  const monthlyServices = await getActiveMonthlyServices(
    tenantId
  );

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

  const invoice = await insertInvoice({
    organizationId: tenant.organization_id,
    tenantId,
    invoiceType: "commissary",
    billingMonth,
    generatedByType: "system",
    generatedById: null,
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

  return { success: true, invoiceId: invoice.id };
}