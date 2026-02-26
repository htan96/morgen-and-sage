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

  // =========================
  // RESOLVE ORGANIZATION
  // =========================

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

  // =========================
  // PREVENT DOUBLE CHECK-IN
  // =========================

  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .is("check_out_time", null)
    .or(
      type === "tenant"
        ? `tenant_id.eq.${person_id}`
        : `employee_id.eq.${person_id}`
    )
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already checked in" },
      { status: 400 }
    );
  }

  // =========================
  // INSERT SESSION
  // =========================

  const insertPayload =
    type === "tenant"
      ? {
          organization_id,
          tenant_id: person_id,
          kitchen_space_id,
          check_in_time: new Date().toISOString(),
        }
      : {
          organization_id,
          employee_id: person_id,
          kitchen_space_id,
          check_in_time: new Date().toISOString(),
        };

  const { error } = await supabase
    .from("sessions")
    .insert(insertPayload);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}