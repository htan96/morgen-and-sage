import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

const ORG_ID = process.env.ORG_ID;

export async function GET() {
  if (!ORG_ID) {
    return NextResponse.json({ error: "Missing ORG_ID" }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id, entity_type, check_in_time")
    .eq("organization_id", ORG_ID)
    .is("check_out_time", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data || [] });
}