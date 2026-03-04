import { NextResponse } from "next/server";
import { runMonthlyBillingForAllTenants } from "@/app/actions/billing/runMonthlyBilling";

function firstOfPreviousMonthUTC() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // current month index (0-based)

  const previousMonthDate = new Date(Date.UTC(year, month - 1, 1));

  const yyyy = previousMonthDate.getUTCFullYear();
  const mm = String(previousMonthDate.getUTCMonth() + 1).padStart(2, "0");

  return `${yyyy}-${mm}-01`;
}

export async function GET(req: Request) {
  try {
    // 🔒 Protect in production
    if (process.env.NODE_ENV !== "development") {
      const auth = req.headers.get("authorization");

      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const url = new URL(req.url);

    // Optional manual month override
    const billingMonth =
      url.searchParams.get("month") || firstOfPreviousMonthUTC();

    console.log("🚀 Running monthly billing for:", billingMonth);

    const results = await runMonthlyBillingForAllTenants(
      billingMonth
    );

    return NextResponse.json({
      success: true,
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