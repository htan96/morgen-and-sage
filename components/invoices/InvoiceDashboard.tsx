"use client";

import { useMemo, useState } from "react";
import InvoiceKPICards from "./InvoiceKPICards";
import InvoiceFilters from "./InvoiceFilters";
import InvoicesTable from "./InvoicesTable";
import ReviewInvoicesModal from "./ReviewInvoicesModal";

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

  const [loadingBilling, setLoadingBilling] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // 🔹 Draft invoices for review
  const draftInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status === "draft");
  }, [invoices]);

  const generateAllInvoices = async () => {
    try {
      setLoadingBilling(true);

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
      const billingMonth = `${yyyy}-${mm}-01`;

      const res = await fetch(
        `/api/billing/run-monthly?month=${billingMonth}`
      );

      const data = await res.json();

      if (!data.success) {
        alert("Billing run failed");
        return;
      }

      alert(
        `Billing completed.\n\nProcessed ${data.totalTenantsProcessed} tenants.`
      );

      location.reload();
    } catch (err) {
      console.error(err);
      alert("Error running billing.");
    } finally {
      setLoadingBilling(false);
    }
  };

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
        inv.invoice_number
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        inv.tenant?.name
          ?.toLowerCase()
          .includes(search.toLowerCase());

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

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Invoices
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Manage and monitor all invoices.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          {/* REVIEW DRAFT INVOICES */}
          <button
            onClick={() => setShowReviewModal(true)}
            disabled={draftInvoices.length === 0}
            className="px-4 py-2 rounded-lg font-medium transition"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              opacity: draftInvoices.length === 0 ? 0.6 : 1,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--surface)")
            }
          >
            Review Drafts ({draftInvoices.length})
          </button>

          {/* GENERATE BILLING */}
          <button
            onClick={() => setShowBillingModal(true)}
            disabled={loadingBilling}
            className="px-4 py-2 rounded-lg font-medium transition"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--surface)")
            }
          >
            {loadingBilling
              ? "Running Billing..."
              : "Generate Current Month"}
          </button>

        </div>
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

      {/* BILLING MODAL */}
      {showBillingModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-2">
              Generate Monthly Invoices
            </h2>

            <p
              className="text-sm mb-6"
              style={{ color: "var(--text-muted)" }}
            >
              This will generate invoices for all eligible tenants for the
              current month. Existing invoices will be skipped.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBillingModal(false)}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "var(--hover)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setShowBillingModal(false);
                  await generateAllInvoices();
                }}
                className="px-4 py-2 rounded-lg font-medium transition"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Run Billing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW INVOICES MODAL */}
      {showReviewModal && (
        <ReviewInvoicesModal
          invoices={draftInvoices}
          onClose={() => setShowReviewModal(false)}
        />
      )}

    </div>
  );
}