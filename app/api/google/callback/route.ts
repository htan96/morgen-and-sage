import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code returned" }, { status: 400 });
  }

  // Pull current profile so we can keep refresh_token if Google doesn't return it
  const { data: existingProfile, error: existingErr } = await supabase
    .from("profiles")
    .select("google_refresh_token")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.json(
      { error: tokens?.error_description || "Token exchange failed", tokens },
      { status: 400 }
    );
  }

  // Get Google email (make sure connect scope includes userinfo.email)
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const googleProfile = await profileRes.json();

  // Compute expiry
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);

  // Use newly returned refresh token if present; otherwise keep existing one
  const refreshTokenToStore = tokens.refresh_token ?? existingProfile?.google_refresh_token ?? null;

  if (!refreshTokenToStore) {
    return NextResponse.json(
      {
        error:
          "No refresh token available. Revoke app access in Google Account → Security → Third-party access, then reconnect.",
      },
      { status: 400 }
    );
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      google_refresh_token: refreshTokenToStore,
      google_access_token: tokens.access_token,
      google_token_expires_at: expiresAt.toISOString(),
      google_email: googleProfile.email ?? null,
      google_connected_at: new Date().toISOString(),
      is_email_sender: true,
    })
    .eq("id", userData.user.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.redirect("https://morgen-and-sage.vercel.app/admin/settings");
}