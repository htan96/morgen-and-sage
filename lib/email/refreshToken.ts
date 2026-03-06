// /lib/email/refreshToken.ts

import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function refreshGoogleAccessToken(profile: any) {

  if (!profile.google_refresh_token) {
    throw new Error("No refresh token stored.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GOOGLE REFRESH ERROR:", data);

    throw new Error(
      `Failed to refresh token: ${data.error || "Unknown error"}`
    );
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  /* -------------------------------- */
  /* Update Supabase profile          */
  /* -------------------------------- */

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      google_access_token: data.access_token,
      google_token_expires_at: expiresAt.toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    console.error("SUPABASE TOKEN UPDATE ERROR:", error);
  }

  return data.access_token;
}