import { voidInvoiceAndDetachBookings } from "@/lib/db/invoices";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await context.params;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoice ID" },
        { status: 400 }
      );
    }

    try {
      await voidInvoiceAndDetachBookings(invoiceId);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "Void failed" },
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