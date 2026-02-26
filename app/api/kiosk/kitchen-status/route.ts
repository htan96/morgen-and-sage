import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function GET() {
  const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2"; // full UUID

  // 1️⃣ Get Kitchens
  const { data: kitchens, error: kitchenError } = await supabaseAdmin
    .from("kitchen_spaces")
    .select("id, name")
    .eq("organization_id", ORG_ID)
    .order("name");

  if (kitchenError) {
    return NextResponse.json(
      { error: kitchenError.message },
      { status: 500 }
    );
  }

  // 2️⃣ Get Active Sessions
  const { data: sessions, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select(`
      id,
      kitchen_space_id,
      check_in_time,
      tenant:tenant_id ( id, name ),
      employee:employee_id ( id, first_name, last_name )
    `)
    .is("check_out_time", null);

  if (sessionError) {
    return NextResponse.json(
      { error: sessionError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    kitchens: kitchens || [],
    sessions: sessions || [],
  });
}