"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DraftInvoiceAlert() {

  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/invoices/drafts");
      const data = await res.json();
      setCount(data.count);
    }

    load();
  }, []);

  if (!count || count === 0) return null;

  return (
    <div
      className="rounded-xl p-4 mb-6 flex justify-between items-center"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div>
        <strong>{count} invoice{count > 1 ? "s" : ""} need review.</strong>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Draft invoices must be reviewed before sending.
        </div>
      </div>

      <Link
        href="/admin/invoices?status=draft"
        className="px-3 py-2 rounded-lg"
        style={{
          background: "var(--hover)",
          border: "1px solid var(--border)",
        }}
      >
        Review Invoices
      </Link>
    </div>
  );
}