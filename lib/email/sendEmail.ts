import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { refreshGoogleAccessToken } from "./refreshToken";

type SendEmailParams = {
  organizationId: string;
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer;
  }[];
};

export async function sendEmail({
  organizationId,
  to,
  subject,
  html,
  attachments = [],
}: SendEmailParams) {

  /* ------------------------------ */
  /* Get Email Sender               */
  /* ------------------------------ */

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_email_sender", true)
    .single();

  if (error || !profile) {
    throw new Error("No email sender configured for this organization.");
  }

  if (!profile.google_email) {
    throw new Error("Sender email missing.");
  }

  if (!profile.google_refresh_token) {
    throw new Error("Google account not connected.");
  }

  /* ------------------------------ */
  /* Access Token                   */
  /* ------------------------------ */

  let accessToken = profile.google_access_token;

  const now = new Date();
  const expiresAt = profile.google_token_expires_at
    ? new Date(profile.google_token_expires_at)
    : null;

  if (!accessToken || !expiresAt || now >= expiresAt) {
    accessToken = await refreshGoogleAccessToken(profile);
  }

  /* ------------------------------ */
  /* Build MIME Email               */
  /* ------------------------------ */

  const boundary = "invoice_boundary";

  const messageParts = [
    `From: Morgen's Kitchen <${profile.google_email}>`,
    `Reply-To: ${profile.google_email}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary=${boundary}`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ];

  /* ------------------------------ */
  /* Attachments                    */
  /* ------------------------------ */

  for (const file of attachments) {
    messageParts.push(
      `--${boundary}`,
      "Content-Type: application/pdf",
      `Content-Disposition: attachment; filename="${file.filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      file.content.toString("base64")
    );
  }

  messageParts.push(`--${boundary}--`);

 const message = messageParts.join("\r\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  /* ------------------------------ */
  /* Send via Gmail API             */
  /* ------------------------------ */

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
      `Gmail send failed: ${gmailData?.error?.message || "Unknown error"}`
    );
  }

  return gmailData;
}