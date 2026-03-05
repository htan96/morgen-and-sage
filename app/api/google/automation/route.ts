import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { enabled } = await req.json();

  /* ------------------------------ */
  /* Check Google Connected         */
  /* ------------------------------ */

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("google_refresh_token")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 400 }
    );
  }

  if (!profile?.google_refresh_token) {
    return NextResponse.json(
      { error: "Connect Google first" },
      { status: 400 }
    );
  }

  /* ------------------------------ */
  /* Set Email Sender               */
  /* ------------------------------ */

  const { error } = await supabase
    .from("profiles")
    .update({
      is_email_sender: !!enabled,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}