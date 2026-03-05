import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const {
      tenantId,
      bookings
    } = body;

    const supabase = await createClient();

    if (!tenantId || !bookings?.length) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const firstBooking = new Date(bookings[0].startTime);

    const earliestDate = new Date(
      Math.min(...bookings.map((b: any) => new Date(b.startTime).getTime()))
    );

    const latestDate = new Date(
      Math.max(...bookings.map((b: any) => new Date(b.startTime).getTime()))
    );

    const totalHours = bookings.reduce((sum: number, b: any) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return sum + (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    }, 0);

    const { data: tenantServices } = await supabase
      .from("tenant_services")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    const hourlyService = tenantServices?.find(
      (s) => s.frequency === "hourly"
    );

    const monthlyService = tenantServices?.find(
      (s) => s.frequency === "monthly"
    );

    const hourlyRate = hourlyService?.amount ?? 0;

    const usageSubtotal = totalHours * hourlyRate;

    let monthlyFee = null;
    let monthlyAlreadyBilled = false;

    const billingMonth = new Date(
      firstBooking.getFullYear(),
      firstBooking.getMonth(),
      1
    );

    if (monthlyService) {

      const nextMonth = new Date(
        billingMonth.getFullYear(),
        billingMonth.getMonth() + 1,
        1
      );

      const { data: existing } = await supabase
        .from("invoice_line_items")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("service_id", monthlyService.service_id)
        .gte("service_date", billingMonth)
        .lt("service_date", nextMonth)
        .maybeSingle();

      if (existing) {
        monthlyAlreadyBilled = true;
        monthlyFee = 0;
      } else {
        monthlyFee = monthlyService.amount;
      }
    }

    const total = usageSubtotal + (monthlyFee ?? 0);

    return NextResponse.json({
      bookingCount: bookings.length,

      earliestDate: earliestDate.toLocaleDateString(),
      latestDate: latestDate.toLocaleDateString(),

      totalHours,
      hourlyRate,

      usageSubtotal: usageSubtotal.toFixed(2),

      monthlyFee,
      monthLabel: billingMonth.toLocaleString("default", { month: "long" }),
      monthlyAlreadyBilled,

      total: total.toFixed(2),

      dueDateLabel: billingMonth.toLocaleDateString(),
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "Preview failed" },
      { status: 500 }
    );
  }
}