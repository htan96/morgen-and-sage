// /app/api/kiosk/check-out/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function POST(req: Request) {
  try {
    const { type, person_id } = await req.json();

    if (!type || !person_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // =========================
    // FIND OPEN SESSION
    // =========================

    const query = supabaseAdmin
      .from("sessions")
      .select("id")
      .eq("entity_type", type)
      .is("check_out_time", null);

    if (type === "tenant") {
      query.eq("tenant_id", person_id);
    } else {
      query.eq("employee_id", person_id);
    }

    const { data: session, error: findError } =
      await query.maybeSingle();

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

    // =========================
    // UPDATE SESSION
    // =========================

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