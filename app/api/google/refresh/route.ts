import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshGoogleAccessToken } from "@/lib/email/refreshToken";

export async function POST() {

  const supabase = await createClient();

  /* -------------------------------- */
  /* Get logged in user               */
  /* -------------------------------- */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* -------------------------------- */
  /* Find profile with Google token   */
  /* (organization sender)            */
  /* -------------------------------- */

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .not("google_refresh_token", "is", null)
    .maybeSingle();

  if (error) {
    console.error("Profile lookup error:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "No Google account connected for this organization" },
      { status: 400 }
    );
  }

  try {

    /* -------------------------------- */
    /* Refresh token                    */
    /* -------------------------------- */

    const accessToken = await refreshGoogleAccessToken(profile);

    console.log("Google token refreshed successfully");

    return NextResponse.json({
      success: true,
      accessToken,
      message: "Google token refreshed successfully",
    });

  } catch (err: any) {

    console.error("Token refresh error:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );

  }

}