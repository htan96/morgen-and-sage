type Props = {
  onUploadClick: () => void;
  onManualClick: () => void;
};

export default function DocumentsHeader({
  onUploadClick,
  onManualClick,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

      {/* LEFT SIDE */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          Documents
        </h1>

        <p
          className="text-sm mt-1 sm:mt-2"
          style={{ color: "var(--text-muted)" }}
        >
          Manage and review financial documents
        </p>
      </div>

      {/* BUTTON GROUP */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

        {/* Manual Expense (Secondary) */}
        <button
          onClick={onManualClick}
          className="
            w-full sm:w-auto
            px-5 py-2.5
            rounded-lg
            text-sm font-medium
            transition
          "
          style={{
            background: "transparent",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          + Manual Expense
        </button>

        {/* Upload Files (Primary) */}
        <button
          onClick={onUploadClick}
          className="
            w-full sm:w-auto
            px-5 py-2.5
            rounded-lg
            text-sm font-medium
            transition
          "
          style={{
            background: "var(--text)",
            color: "var(--bg)",
            border: "1px solid var(--border)",
          }}
        >
          Upload Files
        </button>

      </div>
    </div>
  );
}