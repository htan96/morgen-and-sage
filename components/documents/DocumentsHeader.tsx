type Props = {
  onUploadClick: () => void;
};

export default function DocumentsHeader({ onUploadClick }: Props) {
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

      {/* BUTTON */}
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
  );
}