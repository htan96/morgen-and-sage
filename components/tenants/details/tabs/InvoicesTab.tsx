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

  useEffect(() => {
    fetchInvoices();
  }, [tenantId]);

  async function fetchInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("invoice_date", { ascending: false });

    if (error) {
      console.error(error);
      setInvoices([]);
    } else {
      setInvoices(data || []);
    }

    setLoading(false);
  }

  const totalInvoiced = useMemo(() => {
    return invoices
      .reduce((sum, inv) => sum + inv.total_amount, 0)
      .toFixed(2);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .reduce((sum, inv) => sum + inv.balance_due, 0)
      .toFixed(2);
  }, [invoices]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Invoice History
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {invoices.length} invoices · {formatCurrency(Number(totalInvoiced))} total · {formatCurrency(Number(totalOutstanding))} outstanding
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

                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="ui-btn ui-btn-edit"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}