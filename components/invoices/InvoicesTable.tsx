"use client";

import Link from "next/link";

type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  total_amount: number;
  status: string;
  tenant?: {
    id: string;
    name: string;
  } | null;
};

type Props = {
  invoices: Invoice[];
};

export default function InvoicesTable({ invoices }: Props) {
  if (!invoices || invoices.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        No invoices found.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full text-xs sm:text-sm">
          <thead
            style={{
              background: "var(--hover)",
              borderBottom: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <tr>
              <th className="p-3 text-left">Invoice #</th>
              <th className="p-3 text-left">Tenant</th>
              <th className="p-3 text-left">Invoice Date</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
  {invoices
    .filter((invoice) => invoice.status !== "void")
    .map((invoice) => (
      <tr
        key={invoice.id}
        className="cursor-pointer hover:bg-[var(--hover)] transition"
        style={{
          borderBottom: "1px solid var(--border)",
        }}
      >
        <td className="p-3">
          <Link
            href={`/admin/invoices/${invoice.id}`}
            className="font-medium underline"
          >
            {invoice.invoice_number}
          </Link>
        </td>

        <td className="p-3">
          {invoice.tenant?.name ?? "—"}
        </td>

        <td className="p-3">
          {invoice.invoice_date
            ? new Date(invoice.invoice_date).toLocaleDateString()
            : "—"}
        </td>

        <td className="p-3">
          {invoice.due_date
            ? new Date(invoice.due_date).toLocaleDateString()
            : "—"}
        </td>

        <td className="p-3 font-medium">
          ${Number(invoice.total_amount).toFixed(2)}
        </td>

        <td className="p-3 capitalize">
          {invoice.status}
        </td>
      </tr>
    ))}
</tbody>
        </table>
      </div>
    </div>
  );
}