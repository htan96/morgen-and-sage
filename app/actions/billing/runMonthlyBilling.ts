"use server";

import { createClient } from "@/lib/supabase/server";
import { runMonthlyEngine } from "@/lib/billing/runMonthlyEngine";

export async function runMonthlyBillingForAllTenants(
  billingMonth: string
) {
  const supabase = await createClient();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("is_active", true);

  if (error) throw error;

  const results: any[] = [];

  for (const t of tenants || []) {
    const result = await runMonthlyEngine({
      tenantId: t.id,
      billingMonth,
    });

    results.push({
      tenantId: t.id,
      ...result,
    });
  }

  return results;
}