import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createClient();

  await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("id", id);

  return NextResponse.json({ success: true });
}