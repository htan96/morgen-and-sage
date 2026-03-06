import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { refreshGoogleAccessToken } from "@/lib/email/refreshToken";

export async function GET() {
  try {

    /* -------------------------------- */
    /* Find organization sender         */
    /* -------------------------------- */

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .not("google_refresh_token", "is", null)
      .maybeSingle();

    if (error) {
      console.error("PROFILE ERROR:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: "No Google account connected",
      });
    }

    let accessToken = profile.google_access_token;

    /* -------------------------------- */
    /* Refresh token if expired         */
    /* -------------------------------- */

    const now = new Date();
    const expiresAt = profile.google_token_expires_at
      ? new Date(profile.google_token_expires_at)
      : null;

    if (!accessToken || !expiresAt || now >= expiresAt) {
      console.log("Refreshing Google access token...");

      accessToken = await refreshGoogleAccessToken(profile);
    }

    /* -------------------------------- */
    /* Build raw email                  */
    /* -------------------------------- */

    const email = [
      `From: ${profile.google_email}`,
      `To: htprofitsllc@gmail.com`,
      `Subject: Morgan & Sage Test Email`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      "If you received this, Gmail API is working 🎉",
    ].join("\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    /* -------------------------------- */
    /* Send Gmail API request           */
    /* -------------------------------- */

    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    const gmailResult = await gmailResponse.json();

    console.log("📬 Gmail API Response:", gmailResult);

    if (!gmailResponse.ok) {
      console.error("❌ Gmail Send Failed:", gmailResult);

      return NextResponse.json({
        success: false,
        error: gmailResult,
      });
    }

    console.log("✅ Email sent successfully");

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      gmailMessageId: gmailResult.id,
    });

  } catch (err: any) {

    console.error("SERVER ERROR:", err);

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}