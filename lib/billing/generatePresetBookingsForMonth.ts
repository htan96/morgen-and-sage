import { createClient } from "@/lib/supabase/server";

function getAllDatesForWeekdayInMonth(
  billingMonth: string,
  weekday: number
) {
  const start = new Date(`${billingMonth}T00:00:00.000Z`);
  const month = start.getUTCMonth();
  const dates: Date[] = [];

  const current = new Date(start);

  while (current.getUTCMonth() === month) {
    if (current.getUTCDay() === weekday) {
      dates.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function combineDateAndTime(date: Date, time: string) {
  const [hh, mm, ss] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setUTCHours(hh, mm, ss || 0, 0);
  return combined.toISOString();
}

export async function generatePresetBookingsForMonth(
  tenantId: string,
  billingMonth: string
) {
  const supabase = await createClient();

  // 1️⃣ Get active preset schedules
  const { data: presets, error } = await supabase
    .from("preset_schedules")
    .select(`
      id,
      weekday,
      start_time,
      end_time,
      kitchen_space_id
    `)
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (error) throw error;
  if (!presets || presets.length === 0) return;

  // 2️⃣ Get tenant organization
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("organization_id")
    .eq("id", tenantId)
    .single();

  if (tenantError) throw tenantError;
  if (!tenant) throw new Error("Tenant not found");

  for (const preset of presets as any[]) {
    const dates = getAllDatesForWeekdayInMonth(
      billingMonth,
      preset.weekday
    );

    for (const date of dates) {
      const startISO = combineDateAndTime(date, preset.start_time);
      const endISO = combineDateAndTime(date, preset.end_time);

      const totalHours =
        (new Date(endISO).getTime() -
          new Date(startISO).getTime()) /
        (1000 * 60 * 60);

      if (totalHours <= 0) continue;

      // 3️⃣ Prevent duplicate bookings
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("start_time", startISO)
        .eq("end_time", endISO)
        .maybeSingle();

      if (existing?.id) continue;

      // 4️⃣ Insert booking
      const { error: insertError } = await supabase
        .from("bookings")
        .insert({
          organization_id: tenant.organization_id,
          tenant_id: tenantId,
          kitchen_space_id: preset.kitchen_space_id,
          start_time: startISO,
          end_time: endISO,
          total_hours: totalHours,
          submitted_via: "preset",
        });

      if (insertError) throw insertError;
    }
  }
}