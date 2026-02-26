export default function ReviewKPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Processing
        </p>
        <p className="text-2xl font-semibold mt-2">0</p>
      </div>

      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Ready for Review
        </p>
        <p className="text-2xl font-semibold mt-2">0</p>
      </div>
    </div>
  );
}