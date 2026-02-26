import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

const ORG_ID = process.env.ORG_ID;

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function GET(req: Request) {
  if (!ORG_ID) {
    return NextResponse.json({ error: "Missing ORG_ID" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");

  if (!start) {
    return NextResponse.json({ error: "Missing start" }, { status: 400 });
  }

  const weekStart = new Date(start);
  const weekEnd = addDays(weekStart, 7);

  const { data: sessions, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("organization_id", ORG_ID)
    .lt("check_in_time", weekEnd.toISOString())
    .or(`check_out_time.is.null,check_out_time.gte.${weekStart.toISOString()}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tenantIds = sessions?.map(s => s.tenant_id).filter(Boolean) || [];
  const employeeIds = sessions?.map(s => s.employee_id).filter(Boolean) || [];

  const [{ data: tenants }, { data: employees }] = await Promise.all([
    tenantIds.length
      ? supabaseAdmin.from("tenants").select("id, name").in("id", tenantIds)
      : Promise.resolve({ data: [] }),
    employeeIds.length
      ? supabaseAdmin.from("employees").select("id, first_name, last_name").in("id", employeeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const tenantMap = new Map((tenants || []).map(t => [t.id, t.name]));
  const employeeMap = new Map(
    (employees || []).map(e => [e.id, `${e.first_name} ${e.last_name}`])
  );

  const enriched = sessions?.map(s => ({
    ...s,
    entity_name:
      s.entity_type === "tenant"
        ? tenantMap.get(s.tenant_id) || "Tenant"
        : employeeMap.get(s.employee_id) || "Employee",
  }));

  return NextResponse.json({ sessions: enriched || [] });
}