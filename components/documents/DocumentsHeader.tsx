type Props = {
  onUploadClick: () => void;
};

export default function DocumentsHeader({ onUploadClick }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-semibold">Documents</h1>
        <p
          className="text-sm mt-2"
          style={{ color: "var(--text-muted)" }}
        >
          Manage and review financial documents
        </p>
      </div>

      <button
        onClick={onUploadClick}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition"
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