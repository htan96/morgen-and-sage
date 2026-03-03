import { createClient } from "../supabase/server";

type BookingInput = {
  startTime: string;
  endTime: string;
};

export async function previewBookingInvoice({
  organizationId,
  tenantId,
  bookings,
}: {
  organizationId: string;
  tenantId: string;
  bookings: BookingInput[];
}) {
  const supabase = await createClient();

  if (!bookings || bookings.length === 0) {
    return null;
  }

  // 🔹 Sort bookings
  const sorted = [...bookings].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime()
  );

  const earliest = new Date(sorted[0].startTime);
  const latest = new Date(
    sorted[sorted.length - 1].startTime
  );

  // 🔹 Calculate total hours
  let totalHours = 0;

  for (const booking of bookings) {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    const hours =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60);

    totalHours += hours;
  }

  // 🔹 Get tenant rate + monthly fee
  const { data: rate, error: rateError } =
    await supabase
      .from("tenant_rates")
      .select("hourly_rate, monthly_fee")
      .eq("tenant_id", tenantId)
      .single();

  if (rateError) {
    throw new Error("Unable to fetch tenant rate");
  }

  const hourlyRate = rate.hourly_rate ?? 0;
  const monthlyFee = rate.monthly_fee ?? 0;

  const usageSubtotal = totalHours * hourlyRate;

  // 🔹 Determine month label (based on first booking)
  const monthLabel = earliest.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  // 🔹 Check if monthly already invoiced
  const { data: existingMonthly } =
    await supabase
      .from("invoice_line_items")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("line_type", "monthly")
      .eq("billing_month", monthLabel)
      .maybeSingle();

  const monthlyAlreadyBilled = !!existingMonthly;

  // 🔹 Due date logic
  const today = new Date();
  const diffDays =
    (earliest.getTime() - today.getTime()) /
    (1000 * 60 * 60 * 24);

  let dueDateLabel = "Immediately";

  if (diffDays >= 5) {
    const due = new Date(earliest);
    due.setDate(due.getDate() - 5);
    dueDateLabel = due.toLocaleDateString();
  }

  const total =
    usageSubtotal +
    (monthlyAlreadyBilled ? 0 : monthlyFee);

  return {
    bookingCount: bookings.length,
    earliestDate: earliest.toLocaleDateString(),
    latestDate: latest.toLocaleDateString(),
    totalHours,
    hourlyRate,
    usageSubtotal,
    monthlyFee: monthlyAlreadyBilled
      ? null
      : monthlyFee,
    monthlyAlreadyBilled,
    monthLabel,
    total,
    dueDateLabel,
    warnings: [],
  };
}