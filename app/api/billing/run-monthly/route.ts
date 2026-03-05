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

    // 🔒 CRON PROTECTION
    // Only enforce CRON_SECRET when NO tenantId is provided
    // That means it’s a cron / global run
    if (!tenantId && process.env.NODE_ENV !== "development") {
      const auth = req.headers.get("authorization");

      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // 🧠 Decide billing month
    let billingMonth: string;

    if (manualMonth) {
      // Explicit override (manual button)
      billingMonth = manualMonth;
    } else if (tenantId) {
      // Manual single tenant, no month passed → use CURRENT month
      billingMonth = firstOfCurrentMonthUTC();
    } else {
      // Cron run → use PREVIOUS month
      billingMonth = firstOfPreviousMonthUTC();
    }

    console.log("🚀 Running monthly billing for:", billingMonth);

    // ✅ Single tenant
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

    // ✅ All tenants (cron)
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