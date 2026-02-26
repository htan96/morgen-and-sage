export default function ReviewKPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      <div
        className="rounded-xl p-4 md:p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Processing
        </p>
        <p className="text-xl md:text-2xl font-semibold mt-1 md:mt-2">
          0
        </p>
      </div>

      <div
        className="rounded-xl p-4 md:p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Ready for Review
        </p>
        <p className="text-xl md:text-2xl font-semibold mt-1 md:mt-2">
          0
        </p>
      </div>
    </div>
  );
}