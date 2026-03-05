// /lib/email/sendEmail.ts

import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { refreshGoogleAccessToken } from "./refreshToken";

type SendEmailParams = {
  organizationId: string;
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  organizationId,
  to,
  subject,
  html,
}: SendEmailParams) {
  // 1️⃣ Fetch email sender profile
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_email_sender", true)
    .single();

  if (error || !profile) {
    throw new Error("No email sender configured for organization.");
  }

  let accessToken = profile.google_access_token;

  // 2️⃣ Check expiry
  const now = new Date();
  const expiresAt = new Date(profile.google_token_expires_at);

  if (!accessToken || now >= expiresAt) {
    accessToken = await refreshGoogleAccessToken(profile);
  }

  // 3️⃣ Create Gmail raw message
  const message = [
    `From: ${profile.google_email}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // 4️⃣ Send via Gmail API
  const gmailResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    }
  );

  const gmailData = await gmailResponse.json();

  if (!gmailResponse.ok) {
    throw new Error(
      `Gmail send failed: ${gmailData.error?.message || "Unknown error"}`
    );
  }

  return gmailData;
}