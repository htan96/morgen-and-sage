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

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "void",
        balance_due: 0,
      })
      .eq("id", invoiceId);

    if (error) {
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