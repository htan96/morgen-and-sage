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

  console.log("START BOOKING SESSION");

  const supabase = supabaseAdmin;

  const createdBookings: any[] = [];

  /* ---------------- CREATE BOOKINGS ---------------- */

  for (const booking of bookings) {

    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    const totalHours =
      (end.getTime() - start.getTime()) / 1000 / 60 / 60;

    console.log("Creating booking:", start, end);

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        kitchen_space_id: kitchenSpaceId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        total_hours: totalHours,
      })
      .select()
      .single();

    if (error) {
      console.error("BOOKING INSERT ERROR:", error);
      throw error;
    }

    createdBookings.push(data);
  }

  if (createdBookings.length === 0) {
    throw new Error("No bookings created");
  }

  console.log("Bookings created:", createdBookings.length);

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

  console.log("Billing month:", billingMonthISO);

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
    console.error("INVOICE ERROR:", invoiceError);
    throw invoiceError;
  }

  console.log("Invoice created:", invoice.id);

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
    console.error("TENANT SERVICES ERROR:", servicesError);
    throw servicesError;
  }

  console.log("Tenant services:", tenantServices);

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

  /* ---------------- MONTHLY SERVICES ---------------- */

  const monthlyServices = tenantServices.filter(
    (s: any) => s.frequency === "monthly"
  );

  for (const service of monthlyServices) {

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

  console.log("Line items:", lineItems);

  const { error: lineItemError } = await supabase
    .from("invoice_line_items")
    .insert(lineItems);

  if (lineItemError) {
    console.error("LINE ITEM ERROR:", lineItemError);
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
      console.error("BOOKING UPDATE ERROR:", error);
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

  console.log("Invoice totals updated:", subtotal);

  return {
    invoiceId: invoice.id,
  };
}