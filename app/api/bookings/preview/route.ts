import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {

  const supabase = await createClient();

  const {
    organizationId,
    tenantId,
    kitchenSpaceId,
    bookings
  } = await req.json();

  if (!tenantId || !bookings || bookings.length === 0) {
    return NextResponse.json(
      { error: "Missing booking data" },
      { status: 400 }
    );
  }

  /* -----------------------------
     Fetch Tenant Services
  ----------------------------- */

  const { data: tenantServices, error } =
    await supabase
      .from("tenant_services")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  /* -----------------------------
     Hourly Rate
  ----------------------------- */

  const hourlyService =
    tenantServices?.find(
      (s: any) => s.frequency === "hourly"
    );

  const hourlyRate = hourlyService
    ? Number(hourlyService.amount)
    : 0;

  /* -----------------------------
     Calculate Booking Hours
  ----------------------------- */

  let totalHours = 0;

  for (const booking of bookings) {

    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    const hours =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60);

    totalHours += hours;
  }

  const usageSubtotal = totalHours * hourlyRate;

  /* -----------------------------
     Per Booking Services
  ----------------------------- */

  const perBookingServices =
    tenantServices?.filter(
      (s: any) => s.frequency === "per_booking"
    ) ?? [];

  let perBookingTotal = 0;
  let perBookingPreview: any[] = [];

  for (const service of perBookingServices) {

    const quantity = bookings.length * (service.quantity ?? 1);
    const rate = Number(service.amount);

    const amount = quantity * rate;

    perBookingPreview.push({
      serviceId: service.service_id,
      quantity,
      rate,
      amount
    });

    perBookingTotal += amount;
  }

  /* -----------------------------
     Monthly Services
  ----------------------------- */

  const monthlyServices =
    tenantServices?.filter(
      (s: any) => s.frequency === "monthly"
    ) ?? [];

  let monthlyTotal = 0;
  let monthlyServicesPreview: any[] = [];

  for (const service of monthlyServices) {

    const quantity = service.quantity ?? 1;
    const rate = Number(service.amount);

    const amount = quantity * rate;

    monthlyServicesPreview.push({
      serviceId: service.service_id,
      quantity,
      rate,
      amount
    });

    monthlyTotal += amount;
  }

  /* -----------------------------
     Date Range
  ----------------------------- */

  const sortedBookings = [...bookings].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime()
  );

  const earliestDate =
    new Date(sortedBookings[0].startTime);

  const latestDate =
    new Date(
      sortedBookings[
        sortedBookings.length - 1
      ].startTime
    );

  /* -----------------------------
     Totals
  ----------------------------- */

  const total =
    usageSubtotal +
    perBookingTotal +
    monthlyTotal;

  /* -----------------------------
     Response
  ----------------------------- */

  return NextResponse.json({

    bookingCount: bookings.length,

    earliestDate:
      earliestDate.toLocaleDateString(),

    latestDate:
      latestDate.toLocaleDateString(),

    totalHours:
      Number(totalHours.toFixed(2)),

    hourlyRate,

    usageSubtotal:
      Number(usageSubtotal.toFixed(2)),

    perBookingServices: perBookingPreview,

    monthlyServices: monthlyServicesPreview,

    total:
      Number(total.toFixed(2)),

    dueDateLabel:
      new Date().toLocaleDateString()

  });

}