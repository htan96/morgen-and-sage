import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function POST(req: Request) {
  const supabase = supabaseAdmin;
  const body = await req.json();

  const { type, person_id } = body;

  if (!type || !person_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  let organization_id: string | null = null;
  let kitchen_space_id: string | null = null;

  // ---------------------------
  // TENANT LOGIC
  // ---------------------------
  if (type === "tenant") {
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("organization_id, kitchen_space_id")
      .eq("id", person_id)
      .single();

    if (error || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    if (!tenant.kitchen_space_id) {
      return NextResponse.json(
        { error: "Tenant is not assigned to a kitchen" },
        { status: 400 }
      );
    }

    organization_id = tenant.organization_id;
    kitchen_space_id = tenant.kitchen_space_id;

    // Check if kitchen is occupied by another tenant
    const { data: activeKitchen } = await supabase
      .from("sessions")
      .select("id")
      .eq("kitchen_space_id", kitchen_space_id)
      .eq("entity_type", "tenant")
      .is("check_out_time", null)
      .maybeSingle();

    if (activeKitchen) {
      return NextResponse.json(
        { error: "Kitchen is currently occupied" },
        { status: 400 }
      );
    }
  }

  // ---------------------------
  // EMPLOYEE LOGIC
  // ---------------------------
  if (type === "employee") {
    const { data: employee, error } = await supabase
      .from("employees")
      .select("organization_id")
      .eq("id", person_id)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    organization_id = employee.organization_id;
    kitchen_space_id = null;
  }

  // ---------------------------
  // Prevent double check-in
  // ---------------------------
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

  // ---------------------------
  // Insert session
  // ---------------------------
  const { error: insertError } = await supabase
    .from("sessions")
    .insert({
      organization_id,
      entity_type: type,
      entity_id: person_id,
      kitchen_space_id,
      check_in_time: new Date().toISOString(),
    });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}