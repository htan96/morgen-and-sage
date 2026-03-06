"use server";

import { createClient } from "@/lib/supabase/server";
import { runMonthlyEngine } from "@/lib/billing/runMonthlyEngine";

/**
 * Run monthly billing for a SINGLE tenant
 */
export async function runMonthlyBilling(params: {
  tenantId: string;
  billingMonth: string;
  generatedByType: "admin" | "system" | "tenant";
  generatedById?: string | null;
}) {
  const result = await runMonthlyEngine({
    tenantId: params.tenantId,
    billingMonth: params.billingMonth,
    generatedByType: params.generatedByType,
    generatedById: params.generatedById ?? null,
  });

  return result;
}

/**
 * Run monthly billing for ALL active tenants
 * Used by CRON jobs
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

  for (const tenant of tenants || []) {

    const result = await runMonthlyEngine({
      tenantId: tenant.id,
      billingMonth,
      generatedByType: "system",
      generatedById: null,
    });

    results.push({
      tenantId: tenant.id,
      ...result,
    });
  }

  return results;
}