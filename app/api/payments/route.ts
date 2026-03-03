import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Incoming payment body:", body);

    const {
      invoiceId,
      tenantId,
      organizationId,
      amount,
      method,
      notes,
    } = body;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payments")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        invoice_id: invoiceId,
        amount: Number(amount),
        payment_method: method,
        status: "completed",
        payment_date: new Date().toISOString(),
        notes,
      })
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    console.log("Inserted payment:", data);

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error("Route crash:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}