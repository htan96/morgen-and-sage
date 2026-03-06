import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Get logged in user
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get stored Google connection
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_refresh_token, google_email")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.google_refresh_token) {
    return NextResponse.json(
      { error: "Google not connected" },
      { status: 400 }
    );
  }

  // Exchange refresh token for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.json(
      { error: "Failed to refresh access token", tokenData },
      { status: 400 }
    );
  }

  // Build raw email
  const email = [
    `From: ${profile.google_email}`,
    `To: htprofitsllc@gmail.com`,
    "Subject: Morgan & Sage Test Email",
    "",
    "If you received this, Gmail API is working 🎉",
  ].join("\n");

  const encodedMessage = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send email
  const sendRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    }
  );

  const sendData = await sendRes.json();

  if (!sendRes.ok) {
    return NextResponse.json(
      { error: "Email send failed", sendData },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Email sent successfully",
  });
}