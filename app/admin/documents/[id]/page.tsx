"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DocumentDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const BUCKET_NAME = "documents";

  const [document, setDocument] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          )
        `)
        .eq("id", documentId)
        .single();

      if (error) {
        console.error("Fetch error:", error);
        setLoading(false);
        return;
      }

      setDocument(data);
      setFormData(data);

      if (data.storage_path) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(data.storage_path, 60 * 60);

        if (signedError) {
          console.error("Signed URL error:", signedError);
        } else {
          setSignedUrl(signedData?.signedUrl || null);
        }
      }

      setLoading(false);
    }

    if (documentId) fetchDocument();
  }, [documentId]);

  if (loading) {
    return (
      <div className="p-10" style={{ color: "var(--text-muted)" }}>
        Loading document...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-10 text-red-500">
        Document not found.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/documents")}
        className="px-4 py-2 rounded-lg w-fit"
        style={{
          background: "var(--hover)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        ← Back to Documents
      </button>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT SIDE — PREVIEW */}
        <div
          className="flex-1 rounded-xl p-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="mb-4 font-semibold">Document Preview</p>

          {signedUrl ? (
            <img
              src={signedUrl}
              alt="Document"
              className="w-full rounded-lg"
            />
          ) : (
            <div
              className="h-64 flex items-center justify-center text-center"
              style={{ color: "var(--text-muted)" }}
            >
              No preview available
            </div>
          )}
        </div>

        {/* RIGHT SIDE — DETAILS */}
        <div
          className="flex-1 rounded-xl p-6 space-y-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >

          {/* Header + Edit Button */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">
                {document.vendor_name}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                {document.organizations?.name}
              </p>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "var(--hover)",
                  border: "1px solid var(--border)",
                }}
              >
                Edit
              </button>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm">Amount</label>
            <input
              type="number"
              value={formData?.amount || ""}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full mt-1 px-4 py-2 rounded-lg"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm">Category</label>
            <input
              type="text"
              value={formData?.category || ""}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full mt-1 px-4 py-2 rounded-lg"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Depreciable */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData?.is_depreciable || false}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_depreciable: e.target.checked,
                })
              }
            />
            <span>Depreciable</span>
          </div>

          {/* Status */}
          <div>
            <p
              className="px-3 py-1 inline-block rounded-full text-sm capitalize"
              style={{
                background: "var(--hover)",
                border: "1px solid var(--border)",
              }}
            >
              Status: {document.status}
            </p>
          </div>

          {/* Save / Cancel */}
          {isEditing && (
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  await supabase
                    .from("documents")
                    .update({
                      amount: formData.amount,
                      category: formData.category,
                      is_depreciable: formData.is_depreciable,
                    })
                    .eq("id", document.id);

                  setIsEditing(false);
                  router.refresh();
                }}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "#10b981",
                  color: "#fff",
                }}
              >
                Save
              </button>

              <button
                onClick={() => {
                  setFormData(document);
                  setIsEditing(false);
                }}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "#ef4444",
                  color: "#fff",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Approve / Reject (only when not editing & in review) */}
          {!isEditing && document.status === "review" && (
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  await supabase
                    .from("documents")
                    .update({ status: "approved" })
                    .eq("id", document.id);

                  router.refresh();
                }}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "#10b981",
                  color: "#fff",
                }}
              >
                Approve
              </button>

              <button
                onClick={async () => {
                  await supabase
                    .from("documents")
                    .update({ status: "rejected" })
                    .eq("id", document.id);

                  router.refresh();
                }}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "#ef4444",
                  color: "#fff",
                }}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}