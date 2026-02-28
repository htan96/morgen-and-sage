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

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("id")
      .eq("entity_type", type)
      .eq("entity_id", person_id)
      .is("check_out_time", null)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 400 }
      );
    }

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

  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}