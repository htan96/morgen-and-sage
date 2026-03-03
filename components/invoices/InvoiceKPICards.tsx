"use client";

type Invoice = {
  total_amount: number;
  status: string;
};

export default function InvoiceKPICards({
  invoices,
}: {
  invoices: Invoice[];
}) {
  // Exclude void invoices entirely
  const list = invoices.filter((i) => i.status !== "void");

  const sum = (status: string) =>
    list
      .filter((i) => i.status === status)
      .reduce((acc, i) => acc + Number(i.total_amount), 0);

  const count = (status: string) =>
    list.filter((i) => i.status === status).length;

  const draftCount = count("draft");
  const sentCount = count("sent");
  const partialCount = count("partial");
  const overdueCount = count("overdue");
  const paidCount = count("paid");

  const sentTotal = sum("sent") + sum("partial");
  const partialTotal = sum("partial");
  const overdueTotal = sum("overdue");
  const paidTotal = sum("paid");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      <KPI
        title="Drafts"
        value={draftCount.toString()}
        sub={`${draftCount} for review`}
        accent="rgba(148,163,184,0.9)"
      />

      <KPI
        title="Sent"
        value={sentCount.toString()}
        sub={`Outstanding: ${formatCurrency(sentTotal)}`}
        accent="rgba(59,130,246,0.9)"
      />

      <KPI
        title="Partial"
        value={partialCount.toString()}
        sub={`Remaining: ${formatCurrency(partialTotal)}`}
        accent="rgba(249,115,22,0.95)"
      />

      <KPI
        title="Overdue"
        value={overdueCount.toString()}
        sub={`Past due: ${formatCurrency(overdueTotal)}`}
        accent="rgba(239,68,68,0.95)"
      />

      <KPI
        title="Paid"
        value={paidCount.toString()}
        sub={`Collected: ${formatCurrency(paidTotal)}`}
        accent="rgba(34,197,94,0.95)"
      />
    </div>
  );
}

function KPI({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: accent }}
      />

      <div className="flex items-center justify-between">
        <p
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          {title}
        </p>

        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: accent }}
        />
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p
        className="mt-2 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {sub}
      </p>
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}