import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function GET() {

  const { count, error } = await supabaseAdmin
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}