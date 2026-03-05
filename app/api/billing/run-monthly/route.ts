import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();

    const url = new URL(req.url);

    const tenantId = url.searchParams.get("tenantId");
    const manualMonth = url.searchParams.get("month");

    /**
     * 🔒 USER AUTHENTICATION
     * Require logged-in user unless this is a cron run
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

      // Check admin role
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
     * 🔒 CRON PROTECTION
     * Only enforce CRON_SECRET when it’s a pure cron run
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
     * 🧠 Determine billing month
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
     * SINGLE TENANT BILLING
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
     * ALL TENANTS BILLING
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