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

  /* ---------------- BILLING MONTH ---------------- */

  const firstBooking = createdBookings[0];

  const bookingDate = new Date(firstBooking.start_time);

  const billingMonth = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    1
  );

  const billingMonthISO = billingMonth.toISOString().split("T")[0];

  /* ---------------- CREATE INVOICE ---------------- */

  const invoiceNumber = generateInvoiceNumber(billingMonthISO);

  const invoiceDate = new Date();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: invoiceDate, // your rule
      billing_month: billingMonth,
      status: "draft",
      invoice_type: "manual",
    })
    .select()
    .single();

  if (invoiceError) {
    console.error("INVOICE INSERT ERROR:", invoiceError);
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
    console.error("TENANT SERVICES ERROR:", servicesError);
    throw servicesError;
  }

  if (!tenantServices || tenantServices.length === 0) {
    return { invoiceId: invoice.id };
  }

  /* ---------------- HOURLY SERVICES ---------------- */

const hourlyServices = tenantServices.filter(
  (s: any) => s.frequency === "hourly"
);

for (const booking of createdBookings) {

  for (const service of hourlyServices) {

    const serviceRelation: any = service.services;

    const serviceName =
      Array.isArray(serviceRelation)
        ? serviceRelation[0]?.name
        : serviceRelation?.name;

    const quantity = Number(booking.total_hours) || 1;

    const rate = Number(service.amount) || 0;

    const amount = quantity * rate;

    const { error } = await supabase
      .from("invoice_line_items")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        invoice_id: invoice.id,
        booking_id: booking.id,
        service_id: service.service_id,
        description: serviceName ?? "Service",
        quantity,
        rate,
        amount,
        service_date: booking.start_time,
      });

    if (error) {
      console.error("HOURLY LINE ITEM ERROR:", error);
      throw error;
    }
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

for (const date of uniqueDates) {

  const serviceDate = new Date(date);

  for (const service of perBookingServices) {

    const serviceRelation: any = service.services;

    const serviceName =
      Array.isArray(serviceRelation)
        ? serviceRelation[0]?.name
        : serviceRelation?.name;

    const quantity = Number(service.quantity) || 1;

    const rate = Number(service.amount) || 0;

    const amount = quantity * rate;

    const { error } = await supabase
      .from("invoice_line_items")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        invoice_id: invoice.id,
        service_id: service.service_id,
        description: serviceName ?? "Service",
        quantity,
        rate,
        amount,
        service_date: serviceDate,
      });

    if (error) {
      console.error("PER BOOKING LINE ITEM ERROR:", error);
      throw error;
    }
  }
}

  /* ---------------- MONTHLY SERVICES ---------------- */

const monthlyServices = tenantServices.filter(
  (s: any) => s.frequency === "monthly"
);

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

const { data: existingMonthly } = await supabase
  .from("invoice_line_items")
  .select("service_id")
  .eq("tenant_id", tenantId)
  .gte("service_date", startOfMonth)
  .lt("service_date", nextMonth);

const billedSet = new Set(
  existingMonthly?.map((i: any) => i.service_id)
);

for (const service of monthlyServices) {

  if (billedSet.has(service.service_id)) continue;

  const serviceRelation: any = service.services;

  const serviceName =
    Array.isArray(serviceRelation)
      ? serviceRelation[0]?.name
      : serviceRelation?.name;

  const quantity = Number(service.quantity) || 1;

  const rate = Number(service.amount) || 0;

  const amount = quantity * rate;

  const { error } = await supabase
    .from("invoice_line_items")
    .insert({
      organization_id: organizationId,
      tenant_id: tenantId,
      invoice_id: invoice.id,
      service_id: service.service_id,
      description: serviceName ?? "Service",
      quantity,
      rate,
      amount,
      service_date: startOfMonth,
    });

  if (error) {
    console.error("MONTHLY LINE ITEM ERROR:", error);
    throw error;
  }
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

  return {
    invoiceId: invoice.id,
  };
}