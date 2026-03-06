import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PortalDashboardPage() {
  const supabase = await createClient();

  /* ---------------- Get Logged User ---------------- */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /* ---------------- Get Tenant ---------------- */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!tenant) redirect("/login");

  const tenantId = tenant.id;

  /* ---------------- Upcoming Bookings ---------------- */

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      start_time,
      end_time,
      kitchen_space:kitchen_spaces (
        id,
        name
      )
    `)
    .eq("tenant_id", tenantId)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  /* ---------------- Recent Invoices ---------------- */

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      total_amount,
      status,
      due_date
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(5);

  /* ---------------- Normalize Kitchen ---------------- */

  const normalizedBookings =
    bookings?.map((b: any) => ({
      ...b,
      kitchen_space: Array.isArray(b.kitchen_space)
        ? b.kitchen_space[0] ?? null
        : b.kitchen_space ?? null,
    })) ?? [];

  /* ---------------- Dashboard Stats ---------------- */

  const unpaidTotal =
    invoices
      ?.filter((i) => i.status !== "paid" && i.status !== "void")
      .reduce((sum, i) => sum + Number(i.total_amount || 0), 0) ?? 0;

  const openInvoices =
    invoices?.filter((i) => i.status !== "paid" && i.status !== "void")
      .length ?? 0;

  return (
    <div className="space-y-10">

      {/* Header */}

      <div>
        <h1 className="text-2xl font-semibold">
          Welcome, {tenant.name}
        </h1>

        <p style={{ color: "var(--text-muted)" }}>
          Here’s an overview of your kitchen activity.
        </p>
      </div>

      {/* KPI Cards */}

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
            {normalizedBookings.length}
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
            Open Invoices
          </div>

          <div className="text-2xl font-semibold">
            {openInvoices}
          </div>
        </div>

      </div>

      {/* Upcoming Bookings */}

      <div
        className="p-6 rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="font-semibold mb-4">
          Upcoming Bookings
        </h2>

        <div className="space-y-3">

          {normalizedBookings.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>
              No upcoming bookings.
            </p>
          )}

          {normalizedBookings.map((booking: any) => (
            <div
              key={booking.id}
              className="flex justify-between items-center p-3 rounded-lg"
              style={{
                background: "var(--sidebar-hover)",
              }}
            >
              <div>
                {new Date(booking.start_time).toLocaleDateString()}
              </div>

              <div>
                {booking.kitchen_space?.name ?? "Kitchen"}
              </div>

              <div>
                {new Date(booking.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {new Date(booking.end_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}

      <div
        className="p-6 rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="font-semibold mb-4">
          Recent Invoices
        </h2>

        <div className="space-y-3">

          {invoices?.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>
              No invoices found.
            </p>
          )}

          {invoices?.map((invoice: any) => (
            <div
              key={invoice.id}
              className="flex justify-between items-center p-3 rounded-lg"
              style={{
                background: "var(--sidebar-hover)",
              }}
            >
              <div>{invoice.invoice_number}</div>

              <div>${Number(invoice.total_amount).toLocaleString()}</div>

              <div>{invoice.status}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}