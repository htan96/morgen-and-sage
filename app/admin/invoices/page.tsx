import { createClient } from "@/lib/supabase/server";
import InvoicesTable from "@/components/invoices/InvoicesTable";

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Invoices</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Manage and monitor all invoices.
        </p>
      </div>

      <InvoicesTable invoices={normalizedInvoices} />
    </div>
  );
}