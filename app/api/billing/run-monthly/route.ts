import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  runMonthlyBilling,
  runMonthlyBillingForAllTenants,
} from "@/app/actions/billing/runMonthlyBilling";

/**
 * Get first day of previous month
 */
function firstOfPreviousMonthUTC() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  const previousMonth = new Date(Date.UTC(year, month - 1, 1));

  const yyyy = previousMonth.getUTCFullYear();
  const mm = String(previousMonth.getUTCMonth() + 1).padStart(2, "0");

  return `${yyyy}-${mm}-01`;
}

/**
 * Get first day of current month
 */
function firstOfCurrentMonthUTC() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `${yyyy}-${mm}-01`;
}

export async function GET(req: Request) {
  try {

    const supabase = await createClient();

    const url = new URL(req.url);

    const tenantId = url.searchParams.get("tenantId");
    const manualMonth = url.searchParams.get("month");
    const voidInvoiceId = url.searchParams.get("voidInvoiceId");

    /**
     * ------------------------------------------------
     * USER AUTH CHECK (manual runs only)
     * ------------------------------------------------
     */

    if (tenantId || manualMonth) {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    /**
     * ------------------------------------------------
     * CRON PROTECTION
     * ------------------------------------------------
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
     * ------------------------------------------------
     * DETERMINE BILLING MONTH
     * ------------------------------------------------
     */

    let billingMonth: string;

    if (manualMonth) {
      billingMonth = manualMonth;
    } else if (tenantId) {
      billingMonth = firstOfCurrentMonthUTC();
    } else {
      billingMonth = firstOfPreviousMonthUTC();
    }

    console.log("🚀 Running monthly billing for:", billingMonth);

    /**
     * ------------------------------------------------
     * SINGLE TENANT BILLING
     * ------------------------------------------------
     */

    if (tenantId) {

      const result = await runMonthlyBilling({
        tenantId,
        billingMonth,
        generatedByType: "admin",
        generatedById: null,
        voidSourceInvoiceId: voidInvoiceId,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            mode: "single_tenant",
            tenantId,
            billingMonth,
            reason: result.reason,
            result,
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        mode: "single_tenant",
        tenantId,
        billingMonth,
        result,
      });
    }

    /**
     * ------------------------------------------------
     * ALL TENANTS BILLING (CRON)
     * ------------------------------------------------
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