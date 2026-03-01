"use client";

type Props = {
  value: "standard" | "commissary";
  onChange: (value: "standard" | "commissary") => void;
};

export default function BillingTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex rounded-md border border-[var(--border)] overflow-hidden bg-[var(--bg)]">
      
      <button
        type="button"
        onClick={() => onChange("standard")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition ${
          value === "standard"
            ? "bg-[var(--primary)] text-[var(--surface)]"
            : "text-[var(--text-muted)] hover:bg-[var(--hover)]"
        }`}
      >
        Standard
      </button>

      <button
        type="button"
        onClick={() => onChange("commissary")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition ${
          value === "commissary"
            ? "bg-[var(--primary)] text-[var(--surface)]"
            : "text-[var(--text-muted)] hover:bg-[var(--hover)]"
        }`}
      >
        Commissary
      </button>

    </div>
  );
}