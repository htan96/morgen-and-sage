type Props = {
  status: string | null;
};

export default function StatusBadge({ status }: Props) {
  const value = status?.toLowerCase() || "draft";

  const styles: Record<string, string> = {
    draft:
      "bg-zinc-800 text-zinc-300 border border-zinc-700",
    sent:
      "bg-blue-900/40 text-blue-400 border border-blue-800",
    paid:
      "bg-emerald-900/40 text-emerald-400 border border-emerald-800",
    partial:
      "bg-amber-900/40 text-amber-400 border border-amber-800",
    void:
      "bg-red-900/40 text-red-400 border border-red-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        styles[value] || styles.draft
      }`}
    >
      {value}
    </span>
  );
}
