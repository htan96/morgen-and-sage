import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceId,
      tenantId,
      organizationId,
      amount,
      method,
      notes,
    } = body;

    if (!invoiceId || !tenantId || !organizationId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("payments")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        invoice_id: invoiceId,
        amount: Number(amount),
        payment_method: method,        // ✅ FIXED COLUMN NAME
        status: "completed",           // ✅ REQUIRED
        payment_date: new Date().toISOString(), // ✅ REQUIRED
        notes,
      });

    if (error) {
      console.error("Payment insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}