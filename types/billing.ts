import type { GeneratedByType } from "./invoices";

export type MonthlyBillingInput = {
  tenantId: string;
  billingMonth: string; // "YYYY-MM-01"
  generatedByType: GeneratedByType;
  generatedById?: string | null;
};