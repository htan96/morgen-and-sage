"use server";

import { createClient } from "@/lib/supabase/server";

type CreateBookingInput = {
  organizationId: string;
  tenantId: string;
  kitchenSpaceId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  submittedVia?: "admin" | "portal";
};

function mapBookingError(error: any): string {
  const message = error?.message ?? "";

  if (message.includes("bookings_no_overlap_per_kitchen")) {
    return "This time overlaps an existing booking for this kitchen.";
  }

  if (message.includes("bookings_min_duration_4h")) {
    return "Minimum booking duration is 4 hours.";
  }

  if (message.includes("bookings_start_before_end")) {
    return "End time must be after start time.";
  }

  return "Unable to create booking. Please verify the details.";
}

export async function createBooking(input: CreateBookingInput) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        organization_id: input.organizationId,
        tenant_id: input.tenantId,
        kitchen_space_id: input.kitchenSpaceId,
        start_time: input.startTime,
        end_time: input.endTime,
        notes: input.notes ?? null,
        submitted_via: input.submittedVia ?? "admin",
      })
      .select()
      .single();

    if (error) {
      return { ok: false, error: mapBookingError(error) };
    }

    return { ok: true, booking: data };
  } catch (err) {
    console.error("Booking creation error:", err);
    return { ok: false, error: "Unexpected server error." };
  }
}