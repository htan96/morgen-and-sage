import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {

  const supabase = await createClient();

  const {
    tenantId,
    bookings
  } = await req.json();

  if (!tenantId || !bookings || bookings.length === 0) {
    return NextResponse.json(
      { error: "Missing booking data" },
      { status: 400 }
    );
  }

  /* --------------------------
     Load Tenant Services
  ---------------------------*/

  const { data: tenantServices } = await supabase
    .from("tenant_services")
    .select(`
      *,
      services (
        name
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  /* --------------------------
     Find Hourly Rate
  ---------------------------*/

  const hourlyService =
    tenantServices?.find(
      (s: any) => s.frequency === "hourly"
    );

  const hourlyRate =
    hourlyService ? Number(hourlyService.amount) : 0;

  /* --------------------------
     Calculate Booking Hours
  ---------------------------*/

  let totalHours = 0;

  for (const booking of bookings) {

    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    const hours =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60);

    totalHours += hours;
  }

  const usageSubtotal =
    totalHours * hourlyRate;

  /* --------------------------
     Billing Month Window
  ---------------------------*/

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth()+1);

  /* --------------------------
     Check Already Billed
  ---------------------------*/

  const { data: existingMonthly } =
    await supabase
      .from("invoice_line_items")
      .select("service_id")
      .eq("tenant_id", tenantId)
      .gte("service_date", monthStart.toISOString())
      .lt("service_date", nextMonthStart.toISOString());

  const billedServiceIds =
    new Set(
      existingMonthly?.map((i:any)=>i.service_id)
    );

  /* --------------------------
     Monthly Services
  ---------------------------*/

  const monthlyServices =
    tenantServices?.filter(
      (s:any)=>s.frequency==="monthly"
    ) ?? [];

  let monthlyServicesPreview:any[] = [];
  let monthlyTotal = 0;

  for(const service of monthlyServices){

    const alreadyBilled =
      billedServiceIds.has(service.service_id);

    if(alreadyBilled) continue;

    const quantity =
      service.quantity ?? 1;

    const rate =
      Number(service.amount);

    const amount =
      quantity * rate;

    monthlyServicesPreview.push({

      serviceId: service.service_id,

      name: service.services?.name ?? "Service",

      quantity,

      rate,

      amount

    });

    monthlyTotal += amount;
  }

  /* --------------------------
     Per Booking Services
  ---------------------------*/

  const perBookingServices =
    tenantServices?.filter(
      (s:any)=>s.frequency==="per_booking"
    ) ?? [];

  let perBookingPreview:any[] = [];
  let perBookingTotal = 0;

  for(const service of perBookingServices){

    const quantity =
      bookings.length *
      (service.quantity ?? 1);

    const rate =
      Number(service.amount);

    const amount =
      quantity * rate;

    perBookingPreview.push({

      serviceId: service.service_id,

      name: service.services?.name ?? "Service",

      quantity,

      rate,

      amount

    });

    perBookingTotal += amount;
  }

  /* --------------------------
     Date Range
  ---------------------------*/

  const sorted =
    [...bookings].sort(
      (a,b)=>
        new Date(a.startTime).getTime()
        -
        new Date(b.startTime).getTime()
    );

  const earliestDate =
    new Date(sorted[0].startTime);

  const latestDate =
    new Date(
      sorted[sorted.length-1].startTime
    );

  /* --------------------------
     Final Total
  ---------------------------*/

  const total =
    usageSubtotal +
    monthlyTotal +
    perBookingTotal;

  return NextResponse.json({

    bookingCount:
      bookings.length,

    earliestDate:
      earliestDate.toLocaleDateString(),

    latestDate:
      latestDate.toLocaleDateString(),

    totalHours:
      Number(totalHours.toFixed(2)),

    hourlyRate,

    usageSubtotal:
      Number(usageSubtotal.toFixed(2)),

    monthlyServices:
      monthlyServicesPreview,

    perBookingServices:
      perBookingPreview,

    total:
      Number(total.toFixed(2)),

    dueDateLabel:
      new Date().toLocaleDateString()

  });

}