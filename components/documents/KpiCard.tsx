type Props = {
  label: string;
  value: string | number;
};

export default function KpiCard({ label, value }: Props) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        {label}
      </p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}