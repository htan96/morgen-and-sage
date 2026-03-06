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

/* ---------------- Generate Invoice Number ---------------- */

function generateInvoiceNumber(billingMonth: string) {
  const month = new Date(`${billingMonth}T00:00:00Z`)
    .toLocaleString("en-US", { month: "short", year: "numeric" })
    .replace(" ", "")
    .toUpperCase();

  const random = Math.floor(1000 + Math.random() * 9000);

  return `INV-${month}-${random}`;
}

export async function createBookingSession({
  organizationId,
  tenantId,
  kitchenSpaceId,
  bookings,
}: CreateBookingSessionInput) {

  const supabase = supabaseAdmin;

  const createdBookings: any[] = [];

  /* ---------------- CREATE BOOKINGS ---------------- */

  for (const booking of bookings) {

    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    const totalHours =
      (end.getTime() - start.getTime()) / 1000 / 60 / 60;

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        kitchen_space_id: kitchenSpaceId,
        start_time: start,
        end_time: end,
        total_hours: totalHours,
      })
      .select()
      .single();

    if (error) {

      if (error.code === "23P01") {
        throw new Error(
          "This kitchen is already booked during that time."
        );
      }

      throw error;
    }

    createdBookings.push(data);
  }

  if (createdBookings.length === 0) {
    throw new Error("No bookings created");
  }

  /* ---------------- BILLING MONTH ---------------- */

  const firstBooking = createdBookings[0];

  const bookingDate = new Date(firstBooking.start_time);

  const billingMonth = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    1
  );

  const billingMonthISO =
    billingMonth.toISOString().split("T")[0];

  /* ---------------- CREATE INVOICE ---------------- */

  const invoiceNumber =
    generateInvoiceNumber(billingMonthISO);

  const { data: invoice, error: invoiceError } =
    await supabase
      .from("invoices")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        billing_month: billingMonth,
        invoice_number: invoiceNumber,
        status: "draft",
      })
      .select()
      .single();

  if (invoiceError) throw invoiceError;

  /* ---------------- GET TENANT SERVICES ---------------- */

  const { data: tenantServices, error: servicesError } =
    await supabase
      .from("tenant_services")
      .select(`
        id,
        service_id,
        amount,
        quantity,
        frequency
      `)
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

  if (servicesError) throw servicesError;

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

  /* ---------------- HOURLY SERVICES ---------------- */

  const hourlyServices =
    tenantServices?.filter(
      (s) => s.frequency === "hourly"
    ) ?? [];

  for (const booking of createdBookings) {

    for (const service of hourlyServices) {

      const quantity = booking.total_hours;
      const rate = service.amount;

      const amount = quantity * rate;

      await supabase
        .from("invoice_line_items")
        .insert({
          organization_id: organizationId,
          tenant_id: tenantId,
          invoice_id: invoice.id,
          booking_id: booking.id,
          service_id: service.service_id,
          description:
            serviceMap[service.service_id] ??
            "Kitchen Time",
          quantity,
          rate,
          amount,
          service_date: booking.start_time,
        });
    }
  }

  /* ---------------- PER BOOKING SERVICES ---------------- */

  const perBookingServices =
    tenantServices?.filter(
      (s) => s.frequency === "per_booking"
    ) ?? [];

  const uniqueDates = new Set(
    createdBookings.map((b) =>
      new Date(b.start_time)
        .toISOString()
        .split("T")[0]
    )
  );

  for (const date of uniqueDates) {

    const serviceDate = new Date(date);

    for (const service of perBookingServices) {

      const quantity =
        service.quantity ?? 1;

      const rate =
        service.amount;

      const amount =
        quantity * rate;

      await supabase
        .from("invoice_line_items")
        .insert({
          organization_id: organizationId,
          tenant_id: tenantId,
          invoice_id: invoice.id,
          service_id: service.service_id,
          description:
            serviceMap[service.service_id] ??
            "Daily Service",
          quantity,
          rate,
          amount,
          service_date: serviceDate,
        });
    }
  }

  /* ---------------- MONTHLY SERVICES ---------------- */

  const monthlyServices =
    tenantServices?.filter(
      (s) => s.frequency === "monthly"
    ) ?? [];

  const startOfMonth = new Date(
    billingMonth.getFullYear(),
    billingMonth.getMonth(),
    1
  );

  const nextMonth = new Date(
    billingMonth.getFullYear(),
    billingMonth.getMonth() + 1,
    1
  );

  const { data: existingMonthly } =
    await supabase
      .from("invoice_line_items")
      .select("service_id")
      .eq("tenant_id", tenantId)
      .gte("service_date", startOfMonth)
      .lt("service_date", nextMonth);

  const billedSet =
    new Set(
      existingMonthly?.map(
        (i) => i.service_id
      )
    );

  for (const service of monthlyServices) {

    if (billedSet.has(service.service_id)) continue;

    const quantity =
      service.quantity ?? 1;

    const rate =
      service.amount;

    const amount =
      quantity * rate;

    await supabase
      .from("invoice_line_items")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        invoice_id: invoice.id,
        service_id: service.service_id,
        description:
          serviceMap[service.service_id] ??
          "Monthly Service",
        quantity,
        rate,
        amount,
        service_date: startOfMonth,
      });
  }

  /* ---------------- LINK BOOKINGS ---------------- */

  for (const booking of createdBookings) {

    await supabase
      .from("bookings")
      .update({
        invoice_id: invoice.id,
      })
      .eq("id", booking.id);
  }

  return {
    invoiceId: invoice.id,
  };
}