import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { enabled } = await req.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_refresh_token")
    .eq("id", user.id)
    .single();

  if (!profile?.google_refresh_token) {
    return NextResponse.json(
      { error: "Connect Google first" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ google_automation_enabled: !!enabled })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}