import { getTenantById } from "@/lib/db/tenants";
import { tenantHasPresetSchedule } from "@/lib/db/presets";
import { runPresetMonthlyEngine } from "./runPresetMonthlyEngine";
import { runCommissaryMonthlyEngine } from "./runCommissaryMonthlyEngine";

export async function runMonthlyEngine(params: {
  tenantId: string;
  billingMonth: string; // "YYYY-MM-01"
}) {
  const { tenantId, billingMonth } = params;

  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    return {
      success: false,
      reason: "TENANT_NOT_FOUND",
    };
  }

  const hasKitchen = !!tenant.kitchen_space_id;
  const hasPreset = await tenantHasPresetSchedule(tenantId);

  // 🟢 COMMISSARY TENANT
if (!hasKitchen) {
  return runCommissaryMonthlyEngine({
    tenantId,
    billingMonth,
  });
}

if (hasKitchen && hasPreset) {
  return runPresetMonthlyEngine({
    tenantId,
    billingMonth,
  });
}

  // 🟡 MANUAL KITCHEN TENANT (skip)
  return {
    success: false,
    reason: "MANUAL_KITCHEN_TENANT_SKIPPED",
  };
}