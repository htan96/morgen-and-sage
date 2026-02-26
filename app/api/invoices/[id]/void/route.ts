import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("id", params.id);

  return NextResponse.json({ success: true });
}