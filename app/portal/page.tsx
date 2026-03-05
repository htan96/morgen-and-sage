import { createClient } from "@/lib/supabase/server";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ----------------------------- */
  /* Upcoming Bookings             */
  /* ----------------------------- */

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, kitchen_space_id")
    .eq("tenant_id", user?.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  /* ----------------------------- */
  /* Recent Invoices               */
  /* ----------------------------- */

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, due_date")
    .eq("tenant_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const unpaidTotal =
    invoices
      ?.filter((i) => i.status !== "paid" && i.status !== "void")
      .reduce((sum, i) => sum + Number(i.total_amount || 0), 0) ?? 0;

  return (
    <div className="space-y-8">

      {/* Page Title */}

      <h1 className="text-2xl font-semibold">
        Dashboard
      </h1>

      {/* Summary Cards */}

      <div className="grid md:grid-cols-3 gap-6">

        {/* Upcoming Bookings */}

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

        {/* Outstanding Balance */}

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

        {/* Recent Invoices */}

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

      {/* Upcoming Bookings Table */}

      <div
        className="rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="p-4 font-medium border-b border-[var(--border)]">
          Upcoming Bookings
        </div>

        <div className="p-4 space-y-2">
          {bookings?.length === 0 && (
            <div style={{ color: "var(--text-muted)" }}>
              No upcoming bookings.
            </div>
          )}

          {bookings?.map((b) => (
            <div
              key={b.id}
              className="flex justify-between text-sm"
            >
              <div>
                {new Date(b.start_time).toLocaleDateString()}
              </div>

              <div>
                {new Date(b.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(b.end_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices Table */}

      <div
        className="rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="p-4 font-medium border-b border-[var(--border)]">
          Recent Invoices
        </div>

        <div className="p-4 space-y-2">
          {invoices?.length === 0 && (
            <div style={{ color: "var(--text-muted)" }}>
              No invoices yet.
            </div>
          )}

          {invoices?.map((i) => (
            <div
              key={i.id}
              className="flex justify-between text-sm"
            >
              <div>{i.invoice_number}</div>

              <div>
                ${Number(i.total_amount).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}