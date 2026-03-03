// /lib/email/refreshToken.ts

import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function refreshGoogleAccessToken(profile: any) {
  if (!profile.google_refresh_token) {
    throw new Error("No refresh token stored.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Failed to refresh token: ${data.error || "Unknown error"}`
    );
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Update profile with new access token + expiry
  await supabaseAdmin
    .from("profiles")
    .update({
      google_access_token: data.access_token,
      google_token_expires_at: expiresAt,
    })
    .eq("id", profile.id);

  return data.access_token;
}