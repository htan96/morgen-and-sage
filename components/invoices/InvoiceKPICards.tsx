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
  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + Number(inv.total_amount),
    0
  );

  const unpaid = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const overdue = invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <Card title="Total Revenue" value={totalRevenue} />
      <Card title="Unpaid" value={unpaid} />
      <Card title="Overdue" value={overdue} />

    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <p className="text-xl font-semibold">
        ${value.toFixed(2)}
      </p>
    </div>
  );
}