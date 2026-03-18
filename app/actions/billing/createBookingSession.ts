"use server";

import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

type BookingInput = {
  startTime: string;
  endTime: string;
};

type CreateBookingSessionInput = {
  organizationId: string;
  tenantId: string;
  kitchenSpaceId: string;
  bookings: BookingInput[];
};

function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && endA > startB;
}

function mapBookingError(error: { message?: string }): string {
  const message = error?.message ?? "";
  if (message.includes("bookings_no_overlap_per_kitchen")) {
    return "One or more time slots overlap with an existing booking for this kitchen.";
  }
  if (message.includes("bookings_min_duration_4h")) {
    return "Minimum booking duration is 4 hours.";
  }
  if (message.includes("bookings_start_before_end")) {
    return "End time must be after start time.";
  }
  return "Unable to create booking. Please verify the details.";
}

function generateInvoiceNumber(billingMonth: Date) {
  const year = billingMonth.getFullYear();
  const monthIndex = billingMonth.getMonth();

  const monthNames = [
    "JAN","FEB","MAR","APR","MAY","JUN",
    "JUL","AUG","SEP","OCT","NOV","DEC"
  ];

  const month = monthNames[monthIndex];
  const random = Math.floor(1000 + Math.random() * 9000);

  return `INV-${month}${year}-${random}`;
}

export async function createBookingSession({
  organizationId,
  tenantId,
  kitchenSpaceId,
  bookings,
}: CreateBookingSessionInput) {
  const supabase = supabaseAdmin;

  if (bookings.length === 0) {
    throw new Error("No bookings to create");
  }

  /* ---------------- PREPARE BOOKING ROWS ---------------- */

  const bookingRows = bookings.map((booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const totalHours =
      (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    return {
      organization_id: organizationId,
      tenant_id: tenantId,
      kitchen_space_id: kitchenSpaceId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      total_hours: totalHours,
    };
  });

  /* ---------------- OVERLAP VALIDATION ---------------- */

  const rangeStart = new Date(
    Math.min(...bookingRows.map((r) => new Date(r.start_time).getTime()))
  );
  const rangeEnd = new Date(
    Math.max(...bookingRows.map((r) => new Date(r.end_time).getTime()))
  );

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .eq("kitchen_space_id", kitchenSpaceId)
    .lt("start_time", rangeEnd.toISOString())
    .gt("end_time", rangeStart.toISOString());

  const existing = (existingBookings ?? []).map((b: any) => ({
    start: new Date(b.start_time),
    end: new Date(b.end_time),
  }));

  for (const row of bookingRows) {
    const start = new Date(row.start_time);
    const end = new Date(row.end_time);
    for (const ex of existing) {
      if (intervalsOverlap(start, end, ex.start, ex.end)) {
        throw new Error(mapBookingError({ message: "bookings_no_overlap_per_kitchen" }));
      }
    }
  }

  for (let i = 0; i < bookingRows.length; i++) {
    for (let j = i + 1; j < bookingRows.length; j++) {
      const a = bookingRows[i];
      const b = bookingRows[j];
      if (
        intervalsOverlap(
          new Date(a.start_time),
          new Date(a.end_time),
          new Date(b.start_time),
          new Date(b.end_time)
        )
      ) {
        throw new Error(
          "Selected time slots overlap with each other. Please adjust."
        );
      }
    }
  }

  /* ---------------- CREATE BOOKINGS (ATOMIC) ---------------- */

  const { data: createdBookings, error: insertError } = await supabase
    .from("bookings")
    .insert(bookingRows)
    .select();

  if (insertError) {
    throw new Error(mapBookingError(insertError));
  }

  if (!createdBookings || createdBookings.length === 0) {
    throw new Error("No bookings created");
  }

  /* ---------------- BILLING MONTH ---------------- */

  const earliestBookingDate = new Date(
    Math.min(
      ...createdBookings.map((b) =>
        new Date(b.start_time).getTime()
      )
    )
  );

  const billingMonth = new Date(
    earliestBookingDate.getFullYear(),
    earliestBookingDate.getMonth(),
    1
  );

  const billingMonthISO = billingMonth.toISOString().split("T")[0];

  /* ---------------- CREATE INVOICE ---------------- */

  const invoiceNumber = generateInvoiceNumber(billingMonth);

  const invoiceDate = new Date();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: invoiceDate,
      billing_month: billingMonth,
      status: "draft",
      invoice_type: "manual",
    })
    .select()
    .single();

  if (invoiceError) {
    throw invoiceError;
  }

  /* ---------------- GET TENANT SERVICES ---------------- */

  const { data: tenantServices, error: servicesError } =
    await supabase
      .from("tenant_services")
      .select(`
        id,
        service_id,
        amount,
        quantity,
        frequency,
        services!service_id (
          id,
          name
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

  if (servicesError) {
    throw servicesError;
  }

  if (!tenantServices || tenantServices.length === 0) {
    return { invoiceId: invoice.id };
  }

  const lineItems: any[] = [];

  /* ---------------- HOURLY SERVICES ---------------- */

  const hourlyServices = tenantServices.filter(
    (s: any) => s.frequency === "hourly"
  );

  for (const booking of createdBookings) {

    for (const service of hourlyServices) {

      const relation = service.services as any;

      const serviceName =
        Array.isArray(relation)
          ? relation[0]?.name
          : relation?.name ?? "Service";

      const quantity = Number(booking.total_hours) || 1;
      const rate = Number(service.amount) || 0;
      const amount = quantity * rate;

      lineItems.push({
        organization_id: organizationId,
        tenant_id: tenantId,
        invoice_id: invoice.id,
        booking_id: booking.id,
        service_id: service.service_id,
        description: serviceName,
        quantity,
        rate,
        amount,
        service_date: booking.start_time,
      });

    }

  }

  /* ---------------- PER BOOKING SERVICES ---------------- */

  const perBookingServices = tenantServices.filter(
    (s: any) => s.frequency === "per_booking"
  );

  const uniqueDates = new Set(
    createdBookings.map((b: any) =>
      new Date(b.start_time).toISOString().split("T")[0]
    )
  );

  for (const service of perBookingServices) {

    const relation = service.services as any;

    const serviceName =
      Array.isArray(relation)
        ? relation[0]?.name
        : relation?.name ?? "Service";

    const quantity = uniqueDates.size;
    const rate = Number(service.amount) || 0;
    const amount = quantity * rate;

    lineItems.push({
      organization_id: organizationId,
      tenant_id: tenantId,
      invoice_id: invoice.id,
      service_id: service.service_id,
      description: serviceName,
      quantity,
      rate,
      amount,
      service_date: billingMonth,
    });

  }

  /* ---------------- CHECK EXISTING MONTHLY CHARGES ---------------- */

  const nextMonth = new Date(
    billingMonth.getFullYear(),
    billingMonth.getMonth() + 1,
    1
  );

  const { data: existingMonthlyCharges } = await supabase
    .from("invoice_line_items")
    .select("service_id")
    .eq("tenant_id", tenantId)
    .gte("service_date", billingMonthISO)
    .lt("service_date", nextMonth.toISOString().split("T")[0]);

  const billedServiceIds = new Set(
    existingMonthlyCharges?.map((i) => i.service_id) ?? []
  );

  /* ---------------- MONTHLY SERVICES ---------------- */

  const monthlyServices = tenantServices.filter(
    (s: any) => s.frequency === "monthly"
  );

  for (const service of monthlyServices) {

    if (billedServiceIds.has(service.service_id)) {
      continue;
    }

    const relation = service.services as any;

    const serviceName =
      Array.isArray(relation)
        ? relation[0]?.name
        : relation?.name ?? "Service";

    const quantity = Number(service.quantity) || 1;
    const rate = Number(service.amount) || 0;
    const amount = quantity * rate;

    lineItems.push({
      organization_id: organizationId,
      tenant_id: tenantId,
      invoice_id: invoice.id,
      service_id: service.service_id,
      description: serviceName,
      quantity,
      rate,
      amount,
      service_date: billingMonth,
    });

  }

  /* ---------------- INSERT LINE ITEMS ---------------- */

  const { error: lineItemError } = await supabase
    .from("invoice_line_items")
    .insert(lineItems);

  if (lineItemError) {
    throw lineItemError;
  }

  /* ---------------- LINK BOOKINGS ---------------- */

  for (const booking of createdBookings) {

    const { error } = await supabase
      .from("bookings")
      .update({
        invoice_id: invoice.id,
      })
      .eq("id", booking.id);

    if (error) {
      throw error;
    }

  }

  /* ---------------- CALCULATE TOTALS ---------------- */

  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  await supabase
    .from("invoices")
    .update({
      subtotal,
      total_amount: subtotal,
      balance_due: subtotal,
    })
    .eq("id", invoice.id);

  return {
    invoiceId: invoice.id,
  };
}