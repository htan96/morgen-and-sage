import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

const ORG_ID = process.env.ORG_ID;

export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabaseAdmin.from("sessions").insert({
    organization_id: ORG_ID,
    entity_type: body.entity_type,
    check_in_time: body.check_in_time,
    check_out_time: body.check_out_time,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}