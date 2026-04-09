import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
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

    /* Detach bookings (RLS often allows invoice update but not booking update). */
    const { error: bookingError } = await supabaseAdmin
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