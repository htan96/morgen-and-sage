"use client";

import { useMemo, useState } from "react";
import InvoiceKPICards from "./InvoiceKPICards";
import InvoiceFilters from "./InvoiceFilters";
import InvoicesTable from "./InvoicesTable";

export type Invoice = {
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

export default function InvoicesDashboard({ invoices }: Props) {
  const [status, setStatus] = useState<string>("all");
  const [tenant, setTenant] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: Invoice) => {
      const matchesStatus =
        status === "all" || inv.status === status;

      const matchesTenant =
        tenant === "all" || inv.tenant?.id === tenant;

      const matchesMonth =
        month === "all" ||
        (inv.invoice_date &&
          new Date(inv.invoice_date).getMonth().toString() === month);

      const matchesSearch =
        search === "" ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.tenant?.name?.toLowerCase().includes(search.toLowerCase());

      return (
        matchesStatus &&
        matchesTenant &&
        matchesMonth &&
        matchesSearch
      );
    });
  }, [invoices, status, tenant, month, search]);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 py-6 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">
          Invoices
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Manage and monitor all invoices.
        </p>
      </div>

      <InvoiceKPICards invoices={invoices} />

      <InvoiceFilters
        invoices={invoices}
        status={status}
        setStatus={setStatus}
        tenant={tenant}
        setTenant={setTenant}
        month={month}
        setMonth={setMonth}
        search={search}
        setSearch={setSearch}
      />

      <InvoicesTable invoices={filteredInvoices} />
    </div>
  );
}