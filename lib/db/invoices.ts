import { createClient } from "@/lib/supabase/server";
import type { InvoiceType, GeneratedByType } from "@/types/invoices";

export type InvoiceInsertPayload = {
  organizationId: string;
  tenantId: string;
  invoiceType: InvoiceType;
  billingMonth: string | null;
  generatedByType: GeneratedByType;
  generatedById?: string | null;
  subtotal: number;
  tax: number;
  totalAmount: number;
  balanceDue: number;
  status: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  notes?: string | null;
};

export async function findExistingMonthlyInvoice(
  tenantId: string,
  billingMonth: string,
  invoiceType: InvoiceType
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("billing_month", billingMonth)
    .eq("invoice_type", invoiceType)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function insertInvoice(payload: InvoiceInsertPayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: payload.organizationId,
      tenant_id: payload.tenantId,
      invoice_type: payload.invoiceType,
      billing_month: payload.billingMonth,
      generated_by_type: payload.generatedByType,
      generated_by_id: payload.generatedById ?? null,

      invoice_number: payload.invoiceNumber,
      invoice_date: payload.invoiceDate,
      due_date: payload.dueDate,

      subtotal: payload.subtotal,
      tax: payload.tax,
      total_amount: payload.totalAmount,
      balance_due: payload.balanceDue,
      status: payload.status,
      notes: payload.notes ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  return data;
}

export async function insertInvoiceLineItems(
  invoiceId: string,
  organizationId: string,
  tenantId: string,
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    serviceDate?: string | null;
    bookingId?: string | null;
    notes?: string | null;
  }>
) {
  if (!items.length) return;

  const supabase = await createClient();

  const rows = items.map((i) => ({
    invoice_id: invoiceId,
    organization_id: organizationId,
    tenant_id: tenantId,
    booking_id: i.bookingId ?? null,
    description: i.description,
    quantity: i.quantity,
    rate: i.rate,
    amount: i.amount,
    service_date: i.serviceDate ?? null,
    notes: i.notes ?? null,
  }));

  const { error } = await supabase
    .from("invoice_line_items")
    .insert(rows);

  if (error) throw error;
}