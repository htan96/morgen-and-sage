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

    // Atomic update — only updates if active session exists
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .update({
        check_out_time: new Date().toISOString(),
      })
      .eq("entity_type", type)
      .eq("entity_id", person_id)
      .is("check_out_time", null)
      .select("id, check_in_time")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      session_id: data.id,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}