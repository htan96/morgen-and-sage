import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshGoogleAccessToken } from "@/lib/email/refreshToken";

export async function POST() {

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.google_refresh_token) {
    return NextResponse.json(
      { error: "Google not connected" },
      { status: 400 }
    );
  }

  try {

    const accessToken =
      await refreshGoogleAccessToken(profile);

    return NextResponse.json({
      success: true,
      accessToken,
    });

  } catch (err: any) {

    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );

  }
}