"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDatePacific, formatTimePacific } from "@/lib/datetime";

type Props = {
  tenantId: string;
};

type Booking = {
  id: string;
  start_time: string;
  end_time: string;
  kitchen_spaces: {
    name: string;
  } | null;
};

export default function BookingsTab({ tenantId }: Props) {
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, [tenantId, currentMonth]);

  async function fetchBookings() {
    setLoading(true);

    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

    const { data, error } = await supabase
      .from("bookings")
      .select("*, kitchen_spaces(name)")
      .eq("tenant_id", tenantId)
      .gte("start_time", start.toISOString())
      .lt("start_time", end.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
      setBookings([]);
    } else {
      setBookings(data || []);
    }

    setLoading(false);
  }

  function formatTime(dateString: string) {
    return formatTimePacific(dateString);
  }

  function formatDate(dateString: string) {
    return formatDatePacific(dateString);
  }

  function calculateHours(start: string, end: string) {
    const diff =
      new Date(end).getTime() - new Date(start).getTime();
    return diff / (1000 * 60 * 60);
  }

  const totalHours = useMemo(() => {
    return bookings
      .reduce(
        (sum, b) =>
          sum + calculateHours(b.start_time, b.end_time),
        0
      )
      .toFixed(2);
  }, [bookings]);

  function goToPreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  const monthLabel = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div className="space-y-6">

      {/* Header */}
     <div className="flex justify-between items-center">

  {/* Left: Month Info */}
  <div className="flex items-center gap-4">

    <button
      onClick={goToPreviousMonth}
      className="ui-btn ui-btn-edit text-base"
    >
      ←
    </button>

    <button
      className="px-4 py-1 rounded-lg border border-[var(--border)] 
                 hover:bg-[var(--hover)] transition text-sm font-medium"
    >
      {monthLabel}
    </button>

    <button
      onClick={goToNextMonth}
      className="ui-btn ui-btn-edit text-base"
    >
      →
    </button>

  </div>

  {/* Right: Summary */}
  <div className="text-sm text-[var(--text-muted)]">
    {bookings.length} sessions · {totalHours} hrs
  </div>

</div>

      {/* Table */}
      <div className="ui-table-wrapper">
        <table className="w-full text-sm">
          <thead className="ui-table-head">
            <tr>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Kitchen</th>
              <th className="px-6 py-4 text-left">Start</th>
              <th className="px-6 py-4 text-left">End</th>
              <th className="px-6 py-4 text-right">Hours</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="ui-table-empty">
                  No bookings for this month.
                </td>
              </tr>
            )}

            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-t border-[var(--border)] hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-6 py-4 font-medium">
                  {formatDate(booking.start_time)}
                </td>

                <td className="px-6 py-4 text-[var(--text-muted)]">
                  {booking.kitchen_spaces?.name || "—"}
                </td>

                <td className="px-6 py-4">
                  {formatTime(booking.start_time)}
                </td>

                <td className="px-6 py-4">
                  {formatTime(booking.end_time)}
                </td>

                <td className="px-6 py-4 text-right font-medium">
                  {calculateHours(
                    booking.start_time,
                    booking.end_time
                  ).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}