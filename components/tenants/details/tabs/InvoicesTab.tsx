"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Props = {
  tenantId: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  balance_due: number;
  status: string;
};

export default function InvoicesTab({ tenantId }: Props) {

  const supabase = createClient();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [tenantId]);

  async function fetchInvoices() {

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        invoice_date,
        total_amount,
        balance_due,
        status
      `)
      .eq("tenant_id", tenantId)
      .order("invoice_date", { ascending: false });

    if (error) {
      console.error("Invoice fetch error:", error);
      setInvoices([]);
    } else {
      setInvoices(data || []);
    }

    setLoading(false);
  }

  async function handleRegenerate(invoiceDate: string, invoiceId: string) {

    try {

      setRegenerating(invoiceId);

      const billingMonth = invoiceDate.slice(0, 7) + "-01";

      const res = await fetch(
        `/api/billing/run-monthly?tenantId=${tenantId}&month=${billingMonth}`
      );

      const data = await res.json();

      if (!res.ok) {
        const reason = data.reason ?? data.result?.reason;
        const message =
          reason === "TENANT_MISSING_ORGANIZATION"
            ? "This tenant has no organization assigned. Set it on the tenant record, then try again."
            : reason || data.error || "Failed to regenerate invoice";

        alert(message);

        setRegenerating(null);
        return;
      }

      await fetchInvoices();

    } catch (err) {

      console.error("Regenerate error:", err);
      alert("Failed to regenerate invoice");

    } finally {

      setRegenerating(null);

    }
  }

  const totalInvoiced = useMemo(() => {
    return invoices
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
      .toFixed(2);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0)
      .toFixed(2);
  }, [invoices]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  if (loading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Invoice History
        </h2>

        <p className="text-sm text-[var(--text-muted)] mt-1">
          {invoices.length} invoices ·{" "}
          {formatCurrency(Number(totalInvoiced))} total ·{" "}
          {formatCurrency(Number(totalOutstanding))} outstanding
        </p>
      </div>

      {/* Table */}
      <div className="ui-table-wrapper">

        <table className="w-full text-sm">

          <thead className="ui-table-head">
            <tr>
              <th className="px-6 py-4 text-left">Invoice #</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>

          <tbody>

            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="ui-table-empty">
                  No invoices found.
                </td>
              </tr>
            )}

            {invoices.map((inv) => (

              <tr
                key={inv.id}
                className="border-t border-[var(--border)] hover:bg-[var(--hover)] transition-colors"
              >

                <td className="px-6 py-4 font-medium">
                  {inv.invoice_number}
                </td>

                <td className="px-6 py-4 text-[var(--text-muted)]">
                  {new Date(inv.invoice_date).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-right font-medium">
                  {formatCurrency(inv.total_amount)}
                </td>

                <td className="px-6 py-4 text-right">
                  {formatCurrency(inv.balance_due)}
                </td>

                <td className="px-6 py-4 capitalize">
                  {inv.status}
                </td>

                <td className="px-6 py-4 text-right space-x-2">

                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="ui-btn ui-btn-edit"
                  >
                    View
                  </Link>

                  {inv.status === "void" && (
                    <button
                      onClick={() =>
                        handleRegenerate(inv.invoice_date, inv.id)
                      }
                      disabled={regenerating === inv.id}
                      className="ui-btn ui-btn-primary"
                    >
                      {regenerating === inv.id
                        ? "Generating..."
                        : "Regenerate"}
                    </button>
                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}