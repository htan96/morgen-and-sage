import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { refreshGoogleAccessToken } from "./refreshToken";
import { sendSystemEmail } from "./sendSystemEmail";

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

  console.log("=================================");
  console.log("EMAIL SEND START");
  console.log("Organization:", organizationId);
  console.log("Recipient:", to);
  console.log("Subject:", subject);
  console.log("Attachments:", attachments.length);
  console.log("=================================");

  /* ------------------------------ */
  /* Get Email Sender Profile       */
  /* ------------------------------ */

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_email_sender", true)
    .maybeSingle();

  if (error) {
    console.error("PROFILE FETCH ERROR:", error);
  }

  if (!profile) {
    console.warn("No sender profile found. Using system email.");

    return sendSystemEmail({
      to,
      subject,
      html,
      attachments,
    });
  }

  console.log("Sender profile found:", profile.google_email);

  /* ------------------------------ */
  /* If Gmail not connected         */
  /* ------------------------------ */

  if (!profile.google_refresh_token) {

    console.warn("No Google refresh token. Using system email.");

    return sendSystemEmail({
      to,
      subject,
      html,
      attachments,
    });

  }

  if (!profile.google_email) {

    console.warn("Sender email missing. Using system email.");

    return sendSystemEmail({
      to,
      subject,
      html,
      attachments,
    });

  }

  /* ------------------------------ */
  /* Get Access Token               */
  /* ------------------------------ */

  let accessToken = profile.google_access_token;

  const now = new Date();
  const expiresAt = profile.google_token_expires_at
    ? new Date(profile.google_token_expires_at)
    : null;

  if (!accessToken || !expiresAt || now >= expiresAt) {

    console.log("Access token expired. Refreshing...");

    accessToken = await refreshGoogleAccessToken(profile);

    console.log("Access token refreshed");

  }

  /* ------------------------------ */
  /* Build MIME Email               */
  /* ------------------------------ */

  const boundary = `boundary_${Date.now()}`;

  const messageParts = [
    `From: "Morgan & Sage Billing" <${profile.google_email}>`,
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

    console.log("Attaching file:", file.filename);

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
  /* Gmail Send                     */
  /* ------------------------------ */

  async function sendWithToken(token: string) {

    console.log("Sending email via Gmail API...");

    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      }
    );

    const data = await res.json();

    console.log("Gmail API status:", res.status);
    console.log("Gmail API response:", data);

    return { res, data };

  }

  /* ------------------------------ */
  /* Send Email                     */
  /* ------------------------------ */

  try {

    let { res, data } = await sendWithToken(accessToken);

    /* Token expired retry */

    if (res.status === 401) {

      console.warn("Gmail token expired. Refreshing...");

      accessToken = await refreshGoogleAccessToken(profile);

      const retry = await sendWithToken(accessToken);

      res = retry.res;
      data = retry.data;

    }

    if (!res.ok) {

      console.error("GMAIL SEND FAILED:", data);

      throw new Error("Gmail send failed");

    }

    console.log("EMAIL SENT SUCCESSFULLY VIA GMAIL");
    console.log("Gmail Message ID:", data.id);

    return data;

  } catch (err) {

    console.error("GMAIL ERROR:", err);

    console.warn("Falling back to system email...");

    const fallback = await sendSystemEmail({
      to,
      subject,
      html,
      attachments,
    });

    console.log("System email result:", fallback);

    return fallback;

  }

}