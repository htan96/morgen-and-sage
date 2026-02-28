"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReviewDocumentsView() {
  const supabase = createClient();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningOcr, setRunningOcr] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDocs = async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .in("status", ["pending", "review", "processing", "error"])
      .order("created_at", { ascending: false });

    setDocuments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Auto-refresh while processing
  useEffect(() => {
    if (loading) return;

    const hasProcessing = documents.some(
      (doc) => doc.status === "processing"
    );

    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocs();
    }, 5000);

    return () => clearInterval(interval);
  }, [documents, loading]);

  // Load image when modal opens
  useEffect(() => {
    if (!selectedDoc) return;

    async function loadImage() {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(selectedDoc.storage_path, 120);

      if (data?.signedUrl) setImageUrl(data.signedUrl);
    }

    loadImage();
  }, [selectedDoc]);

  const runOcrBatch = async () => {
    setRunningOcr(true);

    try {
      const { data: pendingDocs } = await supabase
        .from("documents")
        .select("id")
        .eq("status", "pending");

      if (!pendingDocs?.length) {
        alert("No pending documents.");
        return;
      }

      await Promise.all(
        pendingDocs.map(async (doc) => {
          try {
            const res = await fetch("/api/ocr/process", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ documentId: doc.id }),
            });

            if (!res.ok) {
              console.error("OCR failed for:", doc.id);
            }
          } catch (err) {
            console.error("Network error for:", doc.id);
          }
        })
      );

      fetchDocs();
    } catch (err) {
      console.error("Batch OCR error:", err);
      alert("Error running OCR.");
    } finally {
      setRunningOcr(false);
    }
  };

  const pendingCount = documents.filter(d => d.status === "pending").length;
  const processingCount = documents.filter(d => d.status === "processing").length;
  const reviewCount = documents.filter(d => d.status === "review").length;
  const errorCount = documents.filter(d => d.status === "error").length;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 md:space-y-8">

      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Review Queue</h2>

        <button
          onClick={runOcrBatch}
          disabled={runningOcr}
          className="w-full sm:w-auto px-4 py-2 rounded-lg text-white"
          style={{
            background: "#10b981",
            opacity: runningOcr ? 0.7 : 1,
          }}
        >
          {runningOcr ? "Running OCR..." : "Run OCR on Pending"}
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6">
        <KpiCard label="Pending" value={pendingCount} />
        <KpiCard label="Processing" value={processingCount} />
        <KpiCard label="Needs Review" value={reviewCount} />
        <KpiCard label="Errors" value={errorCount} />
      </div>

      {/* DOCUMENT LIST */}
      {documents.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          No documents found.
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const editable =
              doc.status === "review" || doc.status === "error";

            return (
              <div
                key={doc.id}
                onClick={() => editable && setSelectedDoc(doc)}
                className={`p-4 md:p-5 rounded-xl transition ${
                  editable
                    ? "cursor-pointer hover:opacity-80"
                    : "opacity-50 cursor-not-allowed"
                }`}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="font-semibold">
                  {doc.vendor_name || "Unknown Vendor"}
                </div>

                <div className="text-sm opacity-70">
                  {doc.document_date || "No date"}
                </div>

                <div className="mt-1">
                  ${doc.amount ?? "—"}
                </div>

                <div className="text-xs mt-2 capitalize">
                  {doc.status}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REVIEW MODAL */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="w-full h-full md:h-[85vh] md:max-w-6xl bg-[var(--surface)] md:rounded-xl overflow-hidden flex flex-col md:flex-row"
            style={{ border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* IMAGE */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full bg-black flex items-center justify-center p-4 overflow-auto">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Document"
                  className="max-h-full object-contain"
                />
              ) : (
                <div className="text-white">Loading image...</div>
              )}
            </div>

            {/* FORM */}
            <div className="w-full md:w-1/2 flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
              <h3 className="text-xl font-semibold">Review Document</h3>

              <FormField
                label="Vendor Name"
                value={selectedDoc.vendor_name}
                onChange={(v: string) =>
                  setSelectedDoc({ ...selectedDoc, vendor_name: v })
                }
              />

              <FormField
                label="Document Date"
                type="date"
                value={selectedDoc.document_date}
                onChange={(v: string) =>
                  setSelectedDoc({ ...selectedDoc, document_date: v })
                }
              />

              <FormField
                label="Amount"
                type="number"
                value={selectedDoc.amount}
                onChange={(v: string) =>
                  setSelectedDoc({ ...selectedDoc, amount: v })
                }
              />

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--hover)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    setSaving(true);

                    await supabase
                      .from("documents")
                      .update({
                        vendor_name: selectedDoc.vendor_name,
                        document_date: selectedDoc.document_date,
                        amount: selectedDoc.amount,
                        status: "completed",
                      })
                      .eq("id", selectedDoc.id);

                    setSaving(false);
                    setSelectedDoc(null);
                    fetchDocs();
                  }}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 rounded-lg text-white"
                  style={{
                    background: "#10b981",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Completing..." : "Complete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="p-4 md:p-6 rounded-xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm opacity-70">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg mt-1"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      />
    </div>
  );
}