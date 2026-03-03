import { NextResponse } from "next/server";
import { previewBookingInvoice } from "@/lib/billing/previewBookingInvoice";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { organizationId, tenantId, bookings } = body;

    if (!tenantId || !bookings?.length) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const preview = await previewBookingInvoice({
      organizationId,
      tenantId,
      bookings,
    });

    return NextResponse.json(preview);
  } catch (error: any) {
    console.error("Preview error:", error);

    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}