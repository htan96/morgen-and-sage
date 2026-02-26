"use client";

import { useRouter } from "next/navigation";

type Props = {
  document: any;
};

export default function DocumentCard({ document }: Props) {
  const router = useRouter();

  const getStatusColor = () => {
    switch (document.status) {
      case "processing":
        return "#f59e0b";
      case "review":
        return "#3b82f6";
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "var(--text-muted)";
    }
  };

  return (
    <div
      onClick={() => router.push(`/admin/documents/${document.id}`)}
      className="rounded-xl p-5 transition cursor-pointer hover:scale-[1.01]"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">
            {document.vendor_name || "Unknown Vendor"}
          </p>

          {/* Organization Name */}
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {document.organizations?.name || "No Organization"}
          </p>

          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {document.document_date}
          </p>
        </div>

        <span
          className="text-xs px-2 py-1 rounded-full capitalize"
          style={{
            background: getStatusColor(),
            color: "#fff",
          }}
        >
          {document.status}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-lg font-semibold">
          ${Number(document.amount || 0).toFixed(2)}
        </p>
      </div>

      {document.category && (
        <div className="mt-3">
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            {document.category}
          </span>
        </div>
      )}
    </div>
  );
}