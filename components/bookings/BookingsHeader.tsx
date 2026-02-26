"use client";

type Kitchen = {
  id: string;
  name: string;
};

type Props = {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  kitchens: Kitchen[];
  selectedKitchenId: string | null;
  setSelectedKitchenId: (id: string | null) => void;
};

export default function BookingsHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  kitchens,
  selectedKitchenId,
  setSelectedKitchenId,
}: Props) {
  return (
    <div
      className="flex items-center justify-between mb-6 pb-4"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onPrevMonth}
          className="h-9 w-9 rounded-lg flex items-center justify-center transition"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          ←
        </button>

        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          {currentDate.toLocaleString("default", {
            month: "long",
          })}{" "}
          {currentDate.getFullYear()}
        </h2>

        <button
          onClick={onNextMonth}
          className="h-9 w-9 rounded-lg flex items-center justify-center transition"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          →
        </button>

        <button
          onClick={onToday}
          className="ml-4 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{
            background: "var(--hover)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          Today
        </button>
      </div>

      <select
        value={selectedKitchenId ?? ""}
        onChange={(e) =>
          setSelectedKitchenId(e.target.value || null)
        }
        className="px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        <option value="">All Kitchens</option>
        {kitchens.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </select>
    </div>
  );
}