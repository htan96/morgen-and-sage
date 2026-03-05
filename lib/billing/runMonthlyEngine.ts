import { getTenantById } from "@/lib/db/tenants";
import { tenantHasPresetSchedule } from "@/lib/db/presets";
import { runPresetMonthlyEngine } from "./runPresetMonthlyEngine";
import { runCommissaryMonthlyEngine } from "./runCommissaryMonthlyEngine";

export async function runMonthlyEngine(params: {
  tenantId: string;
  billingMonth: string;
  generatedByType?: "admin" | "system" | "tenant";
  generatedById?: string | null;
}) {
  const {
    tenantId,
    billingMonth,
    generatedByType = "system",
    generatedById = null,
  } = params;

  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    return {
      success: false,
      reason: "TENANT_NOT_FOUND",
    };
  }

  const hasKitchen = !!tenant.kitchen_space_id;
  const hasPreset = await tenantHasPresetSchedule(tenantId);

  // COMMISSARY TENANT
  if (!hasKitchen) {
    return runCommissaryMonthlyEngine({
      tenantId,
      billingMonth,
      generatedByType,
      generatedById,
    });
  }

  // PRESET TENANT
  if (hasKitchen && hasPreset) {
    return runPresetMonthlyEngine({
      tenantId,
      billingMonth,
      generatedByType,
      generatedById,
    });
  }

  return {
    success: false,
    reason: "MANUAL_KITCHEN_TENANT_SKIPPED",
  };
}