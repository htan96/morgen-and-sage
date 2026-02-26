import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import RecordPaymentButton from "@/components/invoices/RecordPaymentButton";
import InvoiceActions from "@/components/invoices/InvoiceActions";
import DeletePaymentButton from "@/components/invoices/DeletePaymentButton";

export const revalidate = 0;

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      tenant:tenants(name),
      invoice_line_items(*),
      payments(*)
    `)
    .eq("id", id)
    .single();

  if (!invoice || error) return notFound();

  const totalPaid =
    invoice.payments
      ?.filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0;

  const totalAmount = Number(invoice.total_amount);
  const balance = totalAmount - totalPaid;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* TOP BAR */}
      <div className="flex justify-between items-center">

        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
          style={{
            background: "var(--hover)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          ← Back
        </Link>

        <div className="flex items-center gap-3">

          <RecordPaymentButton
            invoiceId={invoice.id}
            tenantId={invoice.tenant_id}
            organizationId={invoice.organization_id}
          />

          <InvoiceActions invoiceId={invoice.id} />

        </div>
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">
          Invoice #{invoice.invoice_number}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          {invoice.tenant?.name ?? "Unknown Tenant"}
        </p>
      </div>

      {/* SUMMARY */}
      <div
        className="rounded-2xl p-6 grid grid-cols-3 gap-6 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div>
          <p style={{ color: "var(--text-muted)" }}>Total</p>
          <p className="text-2xl font-semibold mt-2">
            ${totalAmount.toFixed(2)}
          </p>
        </div>

        <div>
          <p style={{ color: "var(--text-muted)" }}>Paid</p>
          <p className="text-2xl font-semibold mt-2 text-green-500">
            ${totalPaid.toFixed(2)}
          </p>
        </div>

        <div>
          <p style={{ color: "var(--text-muted)" }}>Balance</p>
          <p className="text-2xl font-semibold mt-2 text-red-500">
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* LINE ITEMS */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="text-lg font-semibold mb-4">
          Line Items
        </h2>

        {invoice.invoice_line_items?.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No line items.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead
              style={{
                background: "var(--hover)",
                borderBottom: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <tr>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-left">Service Date</th>
                <th className="p-4 text-left">Qty</th>
                <th className="p-4 text-left">Rate</th>
                <th className="p-4 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_line_items.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-4">{item.description}</td>
                  <td className="p-4">
                    {item.service_date
                      ? new Date(item.service_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4">${Number(item.rate).toFixed(2)}</td>
                  <td className="p-4 font-medium">
                    ${Number(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAYMENTS */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="text-lg font-semibold mb-4">
          Payments
        </h2>

        {invoice.payments?.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No payments recorded.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead
              style={{
                background: "var(--hover)",
                borderBottom: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Method</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Notes</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment: any) => (
                <tr key={payment.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-4">
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-4">{payment.payment_method ?? "-"}</td>
                  <td className="p-4 font-medium text-green-500">
                    ${Number(payment.amount).toFixed(2)}
                  </td>
                  <td className="p-4">{payment.notes ?? "-"}</td>
                  <td className="p-4 text-right">
                    <DeletePaymentButton paymentId={payment.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}