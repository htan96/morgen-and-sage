"use client";

import { useEffect, useState } from "react";
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
  }, []);

  async function fetchInvoices() {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("invoice_date", { ascending: false });

    setInvoices(data || []);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--hover)] text-[var(--text-muted)]">
            <tr>
              <th className="text-left px-4 py-3">Invoice #</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Balance</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-[var(--text-muted)]"
                >
                  No invoices found.
                </td>
              </tr>
            )}

            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-t border-[var(--border)]"
              >
                <td className="px-4 py-3">{inv.invoice_number}</td>
                <td className="px-4 py-3">
                  {new Date(inv.invoice_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">${inv.total_amount}</td>
                <td className="px-4 py-3">${inv.balance_due}</td>
                <td className="px-4 py-3 capitalize">
                  {inv.status}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="text-xs underline"
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