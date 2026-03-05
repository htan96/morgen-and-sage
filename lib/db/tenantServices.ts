import { createClient } from "@/lib/supabase/server";

export async function getActiveMonthlyServices(tenantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenant_services")
    .select(`
      id,
      amount,
      quantity,
      services (
        name
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("frequency", "monthly")
    .eq("is_active", true);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    name: row.services?.name || "Service",
    amount: Number(row.amount || 0),
    quantity: Number(row.quantity || 1),
  }));
}

export async function getActivePerBookingServices(tenantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenant_services")
    .select(`
      id,
      amount,
      quantity,
      services (
        name
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("frequency", "per_booking")
    .eq("is_active", true);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    name: row.services?.name || "Service",
    amount: Number(row.amount || 0),
    quantity: Number(row.quantity || 1),
  }));
}

export async function getActiveHourlyRate(tenantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenant_services")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("frequency", "hourly")
    .eq("is_active", true)
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) return 0;

  return Number(data[0].amount || 0);
}