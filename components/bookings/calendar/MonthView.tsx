"use client";

import { Booking } from "@/types/booking";

type Props = {
  currentDate: Date;
  bookingsByDate: Record<string, Booking[]>;
  onDayClick: (date: Date) => void;
  onEditBooking: (booking: Booking) => void;
};

const getTenantColor = (tenantId?: string) => {
  if (!tenantId) return "#6b7280";

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#14B8A6",
    "#F97316",
  ];

  let hash = 0;
  for (let i = 0; i < tenantId.length; i++) {
    hash = tenantId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export default function MonthView({
  currentDate,
  bookingsByDate,
  onDayClick,
  onEditBooking,
}: Props) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const daysArray: (Date | null)[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    daysArray.push(new Date(year, month, day));
  }

  const today = new Date();

  return (
    <div className="mt-4">
      {/* Weekday Header */}
      <div
        className="grid grid-cols-7 mb-4 text-xs font-medium uppercase tracking-wide text-center"
        style={{ color: "var(--text-muted)" }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-4">
        {daysArray.map((date, index) => {
          if (!date) return <div key={index} />;

          const key = date.toISOString().split("T")[0];
          const dayBookings = bookingsByDate[key] || [];

          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

          return (
            <div
              key={index}
              onClick={() => onDayClick(date)}
              className="min-h-[140px] rounded-xl p-4 cursor-pointer transition"
              style={{
                background: "var(--surface)",
                border: `1px solid ${
                  isToday ? "var(--grid-strong)" : "var(--border)"
                }`,
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: isToday
                      ? "var(--text)"
                      : "var(--text)",
                  }}
                >
                  {date.getDate()}
                </span>

                {dayBookings.length > 0 && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {dayBookings.length}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {dayBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBooking(b);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full text-white truncate"
                    style={{
                      background: getTenantColor(
                        b.tenant?.id ??
                          b.tenant_id ??
                          "unknown"
                      ),
                    }}
                  >
                    {b.tenant?.name ?? "Unknown"}
                  </div>
                ))}

                {dayBookings.length > 3 && (
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}