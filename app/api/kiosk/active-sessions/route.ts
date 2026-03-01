import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

const ORGANIZATION_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select(`
        id,
        entity_type,
        entity_id,
        check_in_time,
        kitchen_space_id,
        tenants (
          name
        ),
        employees (
          name
        ),
        kitchen_spaces (
          name
        )
      `)
      .eq("organization_id", ORGANIZATION_ID)
      .is("check_out_time", null);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const formatted = data.map((session: any) => ({
      id: session.id,
      entity_type: session.entity_type,
      entity_id: session.entity_id,
      person_name:
        session.entity_type === "tenant"
          ? session.tenants?.name
          : session.employees?.name,
      kitchen_name: session.kitchen_spaces?.name || null,
      check_in_time: session.check_in_time,
    }));

    return NextResponse.json(formatted);

  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}