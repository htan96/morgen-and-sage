import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await context.params;

    const supabase = await createClient();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoice ID" },
        { status: 400 }
      );
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        status: "void",
        balance_due: 0,
      })
      .eq("id", invoiceId);

    if (invoiceError) {
      return NextResponse.json(
        { error: invoiceError.message },
        { status: 500 }
      );
    }

    /* Bookings keep invoice_id unless we clear it; uninvoiced queries use
       invoice_id IS NULL, so void alone left hours "stuck" on a dead invoice. */
    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ invoice_id: null })
      .eq("invoice_id", invoiceId);

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
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