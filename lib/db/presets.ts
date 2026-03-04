import { createClient } from "@/lib/supabase/server";

export async function tenantHasPresetSchedule(tenantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("preset_schedules")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}