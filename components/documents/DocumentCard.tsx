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
      className="
        rounded-xl
        p-3 sm:p-4 md:p-5
        transition
        cursor-pointer
        active:scale-[0.99]
        md:hover:scale-[1.01]
      "
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-start gap-3">

        <div className="min-w-0 flex-1">
          {/* Vendor */}
          <p className="font-semibold text-sm sm:text-base truncate">
            {document.vendor_name || "Unknown Vendor"}
          </p>

          {/* Organization */}
          <p
            className="text-xs sm:text-sm mt-0.5 truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {document.organizations?.name || "No Organization"}
          </p>

          {/* Date */}
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {document.document_date}
          </p>
        </div>

        {/* Status */}
        <span
          className="
            text-[10px] sm:text-xs
            px-2 py-0.5
            rounded-full
            capitalize
            whitespace-nowrap
          "
          style={{
            background: getStatusColor(),
            color: "#fff",
          }}
        >
          {document.status}
        </span>
      </div>

      {/* AMOUNT */}
      <div className="mt-3 sm:mt-4">
        <p className="text-base sm:text-lg font-semibold">
          ${Number(document.amount || 0).toFixed(2)}
        </p>
      </div>

      {/* CATEGORY */}
      {document.category && (
        <div className="mt-2 sm:mt-3">
          <span
            className="text-[10px] sm:text-xs px-2 py-1 rounded-full"
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