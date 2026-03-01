import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function GET(req: Request) {
  const supabase = supabaseAdmin;
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type");
  const query = searchParams.get("q") || "";
  const now = new Date().toISOString();

  if (!type) {
    return NextResponse.json(
      { error: "Missing type" },
      { status: 400 }
    );
  }

  // =========================
  // TENANTS
  // =========================
  if (type === "tenant") {
    const { data: tenants, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, is_active")
      .eq("is_active", true)
      .not("kitchen_space_id", "is", null) // 🔥 Only tenants with kitchens
      .ilike("name", `%${query}%`);

    if (tenantError) {
      return NextResponse.json(
        { error: tenantError.message },
        { status: 500 }
      );
    }

    const { data: bookings } = await supabase
      .from("bookings")
      .select("tenant_id")
      .lte("start_time", now)
      .gte("end_time", now);

    const scheduledIds = new Set(
      (bookings || []).map((b: any) => b.tenant_id)
    );

    const scheduled: any[] = [];
    const others: any[] = [];

    for (const t of tenants || []) {
      if (scheduledIds.has(t.id)) {
        scheduled.push(t);
      } else {
        others.push(t);
      }
    }

    return NextResponse.json({ scheduled, others });
  }

  // =========================
  // EMPLOYEES
  // =========================
  if (type === "employee") {
    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%`
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      scheduled: [],
      others: employees || [],
    });
  }

  return NextResponse.json(
    { error: "Invalid type" },
    { status: 400 }
  );
}