"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  tenantId: string;
};

export default function OverviewTab({ tenantId }: Props) {
  const supabase = createClient();

  const [hours, setHours] = useState<number>(0);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [invoiceStatus, setInvoiceStatus] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // =========================
    // BOOKINGS THIS MONTH
    // =========================
    const { data: bookings } = await supabase
      .from("bookings")
      .select("total_hours")
      .eq("tenant_id", tenantId)
      .gte("start_time", firstDay.toISOString())
      .lte("start_time", lastDay.toISOString());

    const totalHours =
      bookings?.reduce((sum, b) => sum + (b.total_hours || 0), 0) || 0;

    setHours(totalHours);
    setBookingsCount(bookings?.length || 0);

    // =========================
    // TOTAL INVOICED
    // =========================
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, total_amount, invoice_date, status")
      .eq("tenant_id", tenantId);

    const totalInvoiced =
      invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

    // =========================
    // TOTAL PAYMENTS RECEIVED
    // =========================
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("tenant_id", tenantId)
      .eq("status", "completed");

    const totalPaid =
      payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // =========================
    // TRUE OUTSTANDING
    // =========================
    const outstanding = totalInvoiced - totalPaid;

    setBalance(outstanding > 0 ? outstanding : 0);

    // =========================
    // LATEST INVOICE STATUS
    // =========================
    const latestInvoice = invoices
      ?.sort(
        (a, b) =>
          new Date(b.invoice_date).getTime() -
          new Date(a.invoice_date).getTime()
      )[0];

    if (latestInvoice) {
      setInvoiceStatus(latestInvoice.status);
    }

    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card title="Hours This Month" value={hours} />
      <Card title="Bookings This Month" value={bookingsCount} />
      <Card
        title="Outstanding Balance"
        value={`$${balance.toFixed(2)}`}
      />
      <Card title="Latest Invoice Status" value={invoiceStatus} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
      <div className="text-sm text-[var(--text-muted)] mb-2">{title}</div>
      <div className="text-2xl font-semibold text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}