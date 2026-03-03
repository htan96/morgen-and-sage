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

    // 1️⃣ Insert payment
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        tenant_id: tenantId,
        organization_id: organizationId,
        amount: Number(amount),
        method,
        notes,
      });

    if (paymentError) {
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );
    }

    // 2️⃣ Update invoice remaining balance
    const { data: invoice } = await supabase
      .from("invoices")
      .select("remaining_balance, total_amount")
      .eq("id", invoiceId)
      .single();

    if (invoice) {
      const newRemaining =
        Number(invoice.remaining_balance) - Number(amount);

      const isPaid = newRemaining <= 0;

      await supabase
        .from("invoices")
        .update({
          remaining_balance: isPaid ? 0 : newRemaining,
          status: isPaid ? "paid" : "partial",
        })
        .eq("id", invoiceId);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}