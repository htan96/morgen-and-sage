// /app/api/kiosk/check-out/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

const ORGANIZATION_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

export async function POST(req: Request) {
  try {
    const { entity_id } = await req.json();

    if (!entity_id) {
      return NextResponse.json(
        { error: "Missing entity_id" },
        { status: 400 }
      );
    }

    // Find open session
    const { data: session, error: findError } = await supabaseAdmin
      .from("sessions")
      .select("id")
      .eq("organization_id", ORGANIZATION_ID)
      .eq("entity_id", entity_id)
      .is("check_out_time", null)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 400 }
      );
    }

    // Update session
    const { error: updateError } = await supabaseAdmin
      .from("sessions")
      .update({
        check_out_time: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}