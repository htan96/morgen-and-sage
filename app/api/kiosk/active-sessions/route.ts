import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

const ORGANIZATION_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("organization_id", ORGANIZATION_ID)
      .is("check_out_time", null);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}