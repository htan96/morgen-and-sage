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

    // Bookings This Month
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

    // Outstanding Balance
    const { data: invoices } = await supabase
      .from("invoices")
      .select("balance_due, status")
      .eq("tenant_id", tenantId);

    const totalBalance =
      invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;

    setBalance(totalBalance);

    const latest = invoices?.[0];
    if (latest) setInvoiceStatus(latest.status);

    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

      <Card title="Hours This Month" value={hours} />
      <Card title="Bookings This Month" value={bookingsCount} />
      <Card title="Outstanding Balance" value={`$${balance.toFixed(2)}`} />
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