"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("bookings")
      .select("*, kitchen_spaces(name)")
      .eq("tenant_id", tenantId)
      .gte("start_time", startOfMonth.toISOString())
      .order("start_time", { ascending: true });

    setBookings(data || []);
    setLoading(false);
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function calculateHours(start: string, end: string) {
    const diff =
      new Date(end).getTime() - new Date(start).getTime();
    return (diff / (1000 * 60 * 60)).toFixed(2);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Bookings This Month
        </h2>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--hover)] text-[var(--text-muted)]">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Kitchen</th>
              <th className="text-left px-4 py-3">Start</th>
              <th className="text-left px-4 py-3">End</th>
              <th className="text-left px-4 py-3">Hours</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-[var(--text-muted)]"
                >
                  No bookings this month.
                </td>
              </tr>
            )}

            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-t border-[var(--border)]"
              >
                <td className="px-4 py-3">
                  {formatDate(booking.start_time)}
                </td>
                <td className="px-4 py-3">
                  {booking.kitchen_spaces?.name || "—"}
                </td>
                <td className="px-4 py-3">
                  {formatTime(booking.start_time)}
                </td>
                <td className="px-4 py-3">
                  {formatTime(booking.end_time)}
                </td>
                <td className="px-4 py-3">
                  {calculateHours(
                    booking.start_time,
                    booking.end_time
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}