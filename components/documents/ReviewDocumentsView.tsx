"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReviewDocumentsView() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDocs() {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .in("status", ["review", "processing", "error"])
        .order("created_at", { ascending: false });

      setDocuments(data || []);
      setLoading(false);
    }

    fetchDocs();
  }, []);

  const processingCount = documents.filter(d => d.status === "processing").length;
  const reviewCount = documents.filter(d => d.status === "review").length;
  const errorCount = documents.filter(d => d.status === "error").length;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">

      {/* KPI CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <KpiCard label="Processing" value={processingCount} />
        <KpiCard label="Needs Review" value={reviewCount} />
        <KpiCard label="Errors" value={errorCount} />
      </div>

      {/* REVIEW LIST */}
      {documents.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)"
          }}
        >
          No documents in review queue.
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)"
              }}
            >
              <div className="font-semibold">{doc.vendor_name || "Unknown Vendor"}</div>
              <div className="text-sm opacity-70">{doc.document_date}</div>
              <div className="mt-2">${doc.amount ?? "—"}</div>
              <div className="text-xs mt-2">{doc.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)"
      }}
    >
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}