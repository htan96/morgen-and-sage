import { createClient } from "@/lib/supabase/server";
import InvoicesDashboard from "@/components/invoices/InvoiceDashboard";

export default async function PortalInvoicesPage() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  /* Get tenant linked to this user */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!tenant) return null;

  /* Load invoices ONLY for this tenant */

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
    .eq("tenant_id", tenant.id)
    .order("invoice_date", { ascending: false });

  const normalizedInvoices =
    invoices?.map((inv: any) => ({
      ...inv,
      tenant: Array.isArray(inv.tenant)
        ? inv.tenant[0] ?? null
        : inv.tenant ?? null,
    })) ?? [];

  return (
    <InvoicesDashboard
      invoices={normalizedInvoices}
      portalMode={true}
    />
  );
}