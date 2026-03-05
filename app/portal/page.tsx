import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /* ---------------- Tenant ---------------- */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!tenant) redirect("/login");

  const tenantId = tenant.id;

  /* ---------------- Upcoming Bookings ---------------- */

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, kitchen_space_id")
    .eq("tenant_id", tenantId)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  /* ---------------- Recent Invoices ---------------- */

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, due_date")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(5);

  const unpaidTotal =
    invoices
      ?.filter((i) => i.status !== "paid" && i.status !== "void")
      .reduce((sum, i) => sum + Number(i.total_amount || 0), 0) ?? 0;

  return (
    <div className="space-y-8">

      <h1 className="text-2xl font-semibold">
        Dashboard
      </h1>

      {/* Summary Cards */}

      <div className="grid md:grid-cols-3 gap-6">

        <div
          className="p-6 rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Upcoming Bookings
          </div>

          <div className="text-2xl font-semibold">
            {bookings?.length ?? 0}
          </div>
        </div>

        <div
          className="p-6 rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Outstanding Balance
          </div>

          <div className="text-2xl font-semibold">
            ${unpaidTotal.toLocaleString()}
          </div>
        </div>

        <div
          className="p-6 rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Recent Invoices
          </div>

          <div className="text-2xl font-semibold">
            {invoices?.length ?? 0}
          </div>
        </div>

      </div>

    </div>
  );
}