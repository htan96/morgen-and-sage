import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function POST(req: Request) {
  const body = await req.json();

  await supabaseAdmin
    .from("sessions")
    .update({
      check_in_time: body.check_in_time,
      check_out_time: body.check_out_time,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.session_id);

 return NextResponse.json({ success: true });
}