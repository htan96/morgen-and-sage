"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  status: string;
  tenant: {
    id: string;
    name: string;
  } | null;
}

export default function InvoicesTable({
  invoices = [],
}: {
  invoices?: Invoice[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* =========================
     INSTANT FILTERING
  ========================= */

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoice_date);

      const matchesSearch =
        invoice.invoice_number
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        invoice.tenant?.name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        status === "all" || invoice.status === status;

      const matchesFrom =
        !fromDate || invoiceDate >= new Date(fromDate);

      const matchesTo =
        !toDate || invoiceDate <= new Date(toDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [search, status, fromDate, toDate, invoices]);

  /* =========================
     KPI CALCULATIONS
  ========================= */

  const paidRevenue = filteredInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const outstandingRevenue = filteredInvoices
    .filter((i) => i.status === "sent" || i.status === "partial")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const overdueInvoices = filteredInvoices.filter(
    (i) =>
      (i.status === "sent" || i.status === "partial") &&
      i.due_date &&
      new Date(i.due_date) < new Date()
  );

  /* =========================
     STATUS BADGE
  ========================= */

  function renderStatusBadge(status: string) {
    const baseStyle = {
      padding: "4px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 500,
      display: "inline-block",
    };

    const styles: Record<string, any> = {
      draft: {
        ...baseStyle,
        background: "var(--hover)",
        color: "var(--text-muted)",
        border: "1px solid var(--border)",
      },
      sent: {
        ...baseStyle,
        background: "rgba(59,130,246,0.1)",
        color: "rgb(59,130,246)",
        border: "1px solid rgba(59,130,246,0.2)",
      },
      paid: {
        ...baseStyle,
        background: "rgba(16,185,129,0.1)",
        color: "rgb(16,185,129)",
        border: "1px solid rgba(16,185,129,0.2)",
      },
      partial: {
        ...baseStyle,
        background: "rgba(245,158,11,0.1)",
        color: "rgb(245,158,11)",
        border: "1px solid rgba(245,158,11,0.2)",
      },
      void: {
        ...baseStyle,
        background: "rgba(239,68,68,0.1)",
        color: "rgb(239,68,68)",
        border: "1px solid rgba(239,68,68,0.2)",
      },
    };

    return <span style={styles[status] || styles.draft}>{status}</span>;
  }

  return (
    <>
      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-6">
        <Card title="Total Collected">
          ${paidRevenue.toLocaleString()}
        </Card>

        <Card title="Outstanding">
          ${outstandingRevenue.toLocaleString()}
        </Card>

        <Card title="Overdue">
          {overdueInvoices.length}
        </Card>

        <Card title="Total Invoices">
          {filteredInvoices.length}
        </Card>
      </div>

      {/* FILTER BAR */}
      <div className="flex gap-4 mt-6 flex-wrap items-end">
        <input
          type="text"
          placeholder="Search invoice or tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg w-72"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 rounded-lg w-auto appearance-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-4 py-2 rounded-lg"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-4 py-2 rounded-lg"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      {/* TABLE */}
      <div
        className="rounded-2xl overflow-hidden mt-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {filteredInvoices.length === 0 ? (
          <div
            className="p-12 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            No invoices found.
          </div>
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
                <th className="p-4 text-left">Invoice #</th>
                <th className="p-4 text-left">Tenant</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Due</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() =>
                    router.push(`/admin/invoices/${invoice.id}`)
                  }
                  className="cursor-pointer hover:bg-[var(--hover)] transition"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td className="p-4 font-medium text-[var(--primary)]">
                    {invoice.invoice_number}
                  </td>

                  <td className="p-4">
                    {invoice.tenant?.name ?? "—"}
                  </td>

                  <td className="p-4">
                    {new Date(
                      invoice.invoice_date
                    ).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    {invoice.due_date
                      ? new Date(
                          invoice.due_date
                        ).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="p-4 text-right font-semibold">
                    ${Number(
                      invoice.total_amount
                    ).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {renderStatusBadge(invoice.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <p
        className="text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </p>
      <p className="text-2xl font-semibold mt-2">
        {children}
      </p>
    </div>
  );
}