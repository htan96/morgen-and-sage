import { createClient } from "@/lib/supabase/server";

export type TenantRow = {
  id: string;
  organization_id: string;
  name?: string | null;
  is_active?: boolean | null;
  kitchen_space_id?: string | null; // IMPORTANT: used by engine
};

export async function getTenantById(tenantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("id, organization_id, name, is_active, kitchen_space_id")
    .eq("id", tenantId)
    .single();

  if (error) throw error;
  return data as TenantRow;
}