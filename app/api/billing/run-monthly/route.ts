import { NextResponse } from "next/server";
import {
  runMonthlyBilling,
  runMonthlyBillingForAllTenants,
} from "@/app/actions/billing/runMonthlyBilling";

function firstOfPreviousMonthUTC() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  const previousMonthDate = new Date(Date.UTC(year, month - 1, 1));

  const yyyy = previousMonthDate.getUTCFullYear();
  const mm = String(previousMonthDate.getUTCMonth() + 1).padStart(2, "0");

  return `${yyyy}-${mm}-01`;
}

function firstOfCurrentMonthUTC() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `${yyyy}-${mm}-01`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const tenantId = url.searchParams.get("tenantId");
    const manualMonth = url.searchParams.get("month");

    /**
     * 🔒 CRON PROTECTION
     * Only enforce CRON_SECRET when this is a pure cron run
     * (no tenantId and no manual month override)
     */
    if (!tenantId && !manualMonth && process.env.NODE_ENV !== "development") {
      const auth = req.headers.get("authorization");

      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    /**
     * 🧠 Decide billing month
     */
    let billingMonth: string;

    if (manualMonth) {
      // Admin button override
      billingMonth = manualMonth;
    } else if (tenantId) {
      // Manual single tenant without month → use current month
      billingMonth = firstOfCurrentMonthUTC();
    } else {
      // Cron run → previous month
      billingMonth = firstOfPreviousMonthUTC();
    }

    console.log("🚀 Running monthly billing for:", billingMonth);

    /**
     * ✅ Single tenant billing
     */
    if (tenantId) {
      const result = await runMonthlyBilling({
        tenantId,
        billingMonth,
        generatedByType: "admin",
        generatedById: null,
      });

      return NextResponse.json({
        success: true,
        mode: "single_tenant",
        tenantId,
        billingMonth,
        result,
      });
    }

    /**
     * ✅ All tenants billing
     */
    const results = await runMonthlyBillingForAllTenants(billingMonth);

    return NextResponse.json({
      success: true,
      mode: "all_tenants",
      billingMonth,
      totalTenantsProcessed: results.length,
      results,
    });

  } catch (error: any) {
    console.error("❌ Monthly billing failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}