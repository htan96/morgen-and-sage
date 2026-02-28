import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function POST(req: Request) {
  const supabase = supabaseAdmin;
  const body = await req.json();

  const { type, person_id, kitchen_space_id } = body;

  if (!type || !person_id || !kitchen_space_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  let organization_id: string | null = null;

  // Resolve organization
  if (type === "tenant") {
    const { data } = await supabase
      .from("tenants")
      .select("organization_id")
      .eq("id", person_id)
      .single();

    if (!data) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    organization_id = data.organization_id;
  }

  if (type === "employee") {
    const { data } = await supabase
      .from("employees")
      .select("organization_id")
      .eq("id", person_id)
      .single();

    if (!data) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    organization_id = data.organization_id;
  }

  // Prevent double check-in
  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("entity_type", type)
    .eq("entity_id", person_id)
    .is("check_out_time", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already checked in" },
      { status: 400 }
    );
  }

  // Insert session
  const { error } = await supabase
    .from("sessions")
    .insert({
      organization_id,
      entity_type: type,
      entity_id: person_id,
      kitchen_space_id,
      check_in_time: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}