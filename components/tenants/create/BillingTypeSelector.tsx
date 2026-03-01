"use client";

type Props = {
  value: "standard" | "commissary";
  onChange: (value: "standard" | "commissary") => void;
};

export default function BillingTypeSelector({ value, onChange }: Props) {
  return (
    <div
      className="relative flex rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg)",
      }}
    >
      {/* Sliding Background */}
      <div
        className="absolute top-0 bottom-0 transition-all duration-300"
        style={{
          width: "50%",
          left: value === "standard" ? "0%" : "50%",
          background: "var(--surface)",
        }}
      />

      {/* Standard */}
      <button
        type="button"
        onClick={() => onChange("standard")}
        className="relative z-10 flex-1 py-2 text-sm font-medium transition-colors"
        style={{
          color:
            value === "standard"
              ? "var(--text)"
              : "var(--text-muted)",
        }}
      >
        Standard
      </button>

      {/* Commissary */}
      <button
        type="button"
        onClick={() => onChange("commissary")}
        className="relative z-10 flex-1 py-2 text-sm font-medium transition-colors"
        style={{
          color:
            value === "commissary"
              ? "var(--text)"
              : "var(--text-muted)",
        }}
      >
        Commissary
      </button>
    </div>
  );
}