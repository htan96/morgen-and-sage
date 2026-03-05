"use server";

import { createClient } from "@/lib/supabase/server";
import { runMonthlyEngine } from "@/lib/billing/runMonthlyEngine";

/**
 * Run monthly billing for a single tenant
 */
export async function runMonthlyBilling(params: {
  tenantId: string;
  billingMonth: string;
  generatedByType: "admin" | "system" | "tenant";
  generatedById?: string | null;
}) {
  return await runMonthlyEngine({
    tenantId: params.tenantId,
    billingMonth: params.billingMonth,
    generatedByType: params.generatedByType,
    generatedById: params.generatedById ?? null,
  });
}

/**
 * Run monthly billing for ALL active tenants
 */
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
      generatedByType: "system", // Cron / bulk runs are system-generated
      generatedById: null,
    });

    results.push({
      tenantId: t.id,
      ...result,
    });
  }

  return results;
}