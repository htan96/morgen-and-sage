import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const {
      organizationId,
      tenantId,
      kitchenSpaceId,
      bookings,
    } = body;

    const supabase = await createClient();

    if (!tenantId || !bookings?.length) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    /* ---------------- GET TENANT SERVICES ---------------- */

    const { data: tenantServices, error } = await supabase
      .from("tenant_services")
      .select(`
        id,
        amount,
        frequency,
        service_id
      `)
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    if (error) throw error;

    /* ---------------- GET SERVICE NAMES ---------------- */

    const serviceIds =
      tenantServices?.map((s) => s.service_id) ?? [];

    const { data: services } = await supabase
      .from("services")
      .select("id,name")
      .in("id", serviceIds);

    const serviceMap: Record<string, string> = {};

    services?.forEach((s) => {
      serviceMap[s.id] = s.name;
    });

    /* ---------------- PREVIEW CALCULATION ---------------- */

    const lineItems: any[] = [];

    /* HOURLY SERVICES */

    const hourlyServices =
      tenantServices?.filter(
        (s) => s.frequency === "hourly"
      ) ?? [];

    for (const booking of bookings) {

      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      const totalHours =
        (end.getTime() - start.getTime()) /
        1000 /
        60 /
        60;

      for (const service of hourlyServices) {

        const quantity = totalHours;
        const rate = service.amount;
        const amount = quantity * rate;

        lineItems.push({
          description:
            serviceMap[service.service_id] ??
            "Kitchen Time",
          quantity,
          rate,
          amount,
          service_date: start,
        });
      }
    }

    /* CLEANING FEE (PER DAY) */

    const perDayServices =
      tenantServices?.filter(
        (s) => s.frequency === "per_booking"
      ) ?? [];

const uniqueDates: Set<string> = new Set(
  bookings.map((b: any) =>
    new Date(b.startTime)
      .toISOString()
      .split("T")[0]
  )
);

for (const date of uniqueDates as Set<string>) {
  const serviceDate = new Date(date);

      for (const service of perDayServices) {

        const quantity = 1;
        const rate = service.amount;

        lineItems.push({
          description:
            serviceMap[service.service_id] ??
            "Cleaning Fee",
          quantity,
          rate,
          amount: rate,
          service_date: serviceDate,
        });
      }
    }

    /* MONTHLY SERVICES */

    const monthlyServices =
      tenantServices?.filter(
        (s) => s.frequency === "monthly"
      ) ?? [];

    if (monthlyServices.length > 0) {

      const firstBooking = bookings[0];

      const startOfMonth = new Date(
        new Date(firstBooking.startTime)
          .getFullYear(),
        new Date(firstBooking.startTime)
          .getMonth(),
        1
      );

      for (const service of monthlyServices) {

        const rate = service.amount;

        lineItems.push({
          description:
            serviceMap[service.service_id] ??
            "Monthly Membership",
          quantity: 1,
          rate,
          amount: rate,
          service_date: startOfMonth,
        });
      }
    }

    /* ---------------- TOTAL ---------------- */

    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    return NextResponse.json({
      bookingCount: bookings.length,
      lineItems,
      totalAmount,
    });

  } catch (err) {

    console.error("Preview error:", err);

    return NextResponse.json(
      { error: "Preview failed" },
      { status: 500 }
    );
  }
}