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
      paymentDate,
    } = body;

    const supabase = await createClient();

    const paymentAmount = Number(amount);

    /* -----------------------------
       1️⃣ Get invoice
    ----------------------------- */

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("total_amount, balance_due, status")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "void") {
      return NextResponse.json(
        { error: "Cannot pay a void invoice" },
        { status: 400 }
      );
    }

    /* -----------------------------
       2️⃣ Insert payment
    ----------------------------- */

    const { data, error } = await supabase
      .from("payments")
      .insert({
        organization_id: organizationId,
        tenant_id: tenantId,
        invoice_id: invoiceId,
        amount: paymentAmount,
        payment_method: method,
        status: "completed",
        payment_date: paymentDate
          ? new Date(paymentDate + "T12:00:00.000Z").toISOString()
          : new Date().toISOString(),
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

    /* -----------------------------
       3️⃣ Calculate new balance
    ----------------------------- */

    const newBalance = Number(invoice.balance_due) - paymentAmount;

    let newStatus = "partial";

    if (newBalance <= 0) {
      newStatus = "paid";
    }

    /* -----------------------------
       4️⃣ Update invoice
    ----------------------------- */

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        balance_due: newBalance <= 0 ? 0 : newBalance,
        status: newStatus,
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Invoice update error:", updateError);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Route crash:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}