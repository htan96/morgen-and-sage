export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail";

export async function POST(req: Request) {
  try {

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    // Send invoice email
    await sendInvoiceEmail(invoiceId);

    // Update invoice status
    const { error } = await supabaseAdmin
      .from("invoices")
      .update({
        status: "sent",
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (error) {
      console.error("Invoice update error:", error);

      return NextResponse.json(
        { error: "Invoice email sent but failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {

    console.error("Send invoice error:", err);

    return NextResponse.json(
      { error: err.message || "Failed to send invoice" },
      { status: 500 }
    );
  }
}