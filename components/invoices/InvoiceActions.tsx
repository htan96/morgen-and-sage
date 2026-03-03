"use client";

import { Printer, Ban } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InvoiceActions({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const router = useRouter();

  if (!invoiceId) {
    return null; // Prevent rendering if undefined
  }

  async function handleVoid() {
    const confirmVoid = confirm(
      "Are you sure you want to void this invoice?"
    );

    if (!confirmVoid) return;

    const res = await fetch(
      `/api/invoices/${invoiceId}/void`,
      {
        method: "POST",
      }
    );

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to void invoice.");
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">

      {/* PDF BUTTON */}
      <Link
        href={`/reports/invoice/${invoiceId}`}
        target="_blank"
        className="
          w-full sm:w-auto
          inline-flex items-center justify-center gap-2
          px-3 sm:px-4
          py-2
          rounded-lg
          text-sm font-medium
          transition
        "
        style={{
          background: "var(--hover)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        <Printer size={16} />
        <span>PDF</span>
      </Link>

      {/* VOID BUTTON */}
      <button
        onClick={handleVoid}
        className="
          w-full sm:w-auto
          inline-flex items-center justify-center gap-2
          px-3 sm:px-4
          py-2
          rounded-lg
          text-sm font-medium
          transition
        "
        style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "rgb(239,68,68)",
        }}
      >
        <Ban size={16} />
        <span>Void</span>
      </button>

    </div>
  );
}