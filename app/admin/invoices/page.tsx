import { createClient } from "@/lib/supabase/server";
import InvoicesDashboard from "@/components/invoices/InvoiceDashboard";

const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      invoice_date,
      due_date,
      total_amount,
      status,
      tenant:tenants (
        id,
        name
      )
    `)
    .eq("organization_id", ORG_ID)
    .order("invoice_date", { ascending: false });

  const normalizedInvoices =
    invoices?.map((inv: any) => ({
      ...inv,
      tenant: Array.isArray(inv.tenant)
        ? inv.tenant[0] ?? null
        : inv.tenant ?? null,
    })) ?? [];

  return <InvoicesDashboard invoices={normalizedInvoices} />;
}