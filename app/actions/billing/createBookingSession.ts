"use server";

import { createClient } from "@/lib/supabase/server";

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

export async function createBookingSession({
  organizationId,
  tenantId,
  kitchenSpaceId,
  bookings,
}: CreateBookingSessionInput) {

  const supabase = await createClient();

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

    if (error) throw error;

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

  /* ---------------- CREATE INVOICE ---------------- */

  const { data: invoice, error: invoiceError } =
    await supabase
      .from("invoices")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        billing_month: billingMonth,
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
        amount,
        frequency,
        service_id
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
            "Hourly Service",
          quantity,
          rate,
          amount,
          service_date: booking.start_time,
        });
    }
  }

  /* ---------------- PER DAY SERVICES ---------------- */

  const perDayServices =
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

    for (const service of perDayServices) {

      const quantity = 1;
      const rate = service.amount;

      const amount = quantity * rate;

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

  for (const service of monthlyServices) {

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

    const { data: existing } =
      await supabase
        .from("invoice_line_items")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("service_id", service.service_id)
        .gte("service_date", startOfMonth)
        .lt("service_date", nextMonth)
        .maybeSingle();

    if (existing) continue;

    const rate = service.amount;

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
        quantity: 1,
        rate,
        amount: rate,
        service_date: startOfMonth,
      });
  }

  /* ---------------- LINK BOOKINGS TO INVOICE ---------------- */

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