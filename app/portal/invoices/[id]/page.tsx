import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  /* Get tenant linked to user */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!tenant) return notFound();

  /* Load invoice */

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      tenant:tenants(name),
      invoice_line_items(*),
      payments(*)
    `)
    .eq("id", id)
    .eq("tenant_id", tenant.id)   // 🔒 prevents viewing other invoices
    .single();

  if (!invoice || error) return notFound();

  const totalPaid =
    invoice.payments
      ?.filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0;

  const totalAmount = Number(invoice.total_amount);
  const balance = totalAmount - totalPaid;

  return (
    <div className="w-full px-3 sm:px-5 md:px-8 py-5 md:py-6 space-y-6 md:space-y-8">

      {/* BACK */}
      <Link
        href="/portal/invoices"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--hover)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        ← Back
      </Link>

      {/* HEADER */}

      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">
          Invoice #{invoice.invoice_number}
        </h1>

        <p
          className="text-sm mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          {invoice.tenant?.name ?? "Tenant"}
        </p>
      </div>

      {/* SUMMARY */}

      <div
        className="rounded-2xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div>
          <p style={{ color: "var(--text-muted)" }}>Total</p>
          <p className="text-lg sm:text-2xl font-semibold mt-2">
            ${totalAmount.toFixed(2)}
          </p>
        </div>

        <div>
          <p style={{ color: "var(--text-muted)" }}>Paid</p>
          <p className="text-lg sm:text-2xl font-semibold mt-2 text-green-500">
            ${totalPaid.toFixed(2)}
          </p>
        </div>

        <div>
          <p style={{ color: "var(--text-muted)" }}>Balance</p>
          <p className="text-lg sm:text-2xl font-semibold mt-2 text-red-500">
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* LINE ITEMS */}

      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >

        <h2 className="text-base sm:text-lg font-semibold mb-4">
          Line Items
        </h2>

        {invoice.invoice_line_items?.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No line items.
          </p>
        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[520px] w-full text-xs sm:text-sm">

              <thead
                style={{
                  background: "var(--hover)",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >

                <tr>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Service Date</th>
                  <th className="p-3 text-left">Qty</th>
                  <th className="p-3 text-left">Rate</th>
                  <th className="p-3 text-left">Amount</th>
                </tr>

              </thead>

              <tbody>

                {invoice.invoice_line_items.map((item: any) => (

                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >

                    <td className="p-3">{item.description}</td>

                    <td className="p-3">
                      {item.service_date
                        ? new Date(item.service_date).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-3">{item.quantity}</td>

                    <td className="p-3">
                      ${Number(item.rate).toFixed(2)}
                    </td>

                    <td className="p-3 font-medium">
                      ${Number(item.amount).toFixed(2)}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* PAYMENTS */}

      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >

        <h2 className="text-base sm:text-lg font-semibold mb-4">
          Payments
        </h2>

        {invoice.payments?.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No payments recorded.
          </p>
        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[520px] w-full text-xs sm:text-sm">

              <thead
                style={{
                  background: "var(--hover)",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >

                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Notes</th>
                </tr>

              </thead>

              <tbody>

                {invoice.payments.map((payment: any) => (

                  <tr
                    key={payment.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >

                    <td className="p-3">
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="p-3">
                      {payment.payment_method ?? "-"}
                    </td>

                    <td className="p-3 font-medium text-green-500">
                      ${Number(payment.amount).toFixed(2)}
                    </td>

                    <td className="p-3">
                      {payment.notes ?? "-"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}