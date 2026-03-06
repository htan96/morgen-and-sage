import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendSystemEmail({
  to,
  subject,
  html,
  attachments = [],
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}) {
  const { data, error } = await resend.emails.send({
    from: "Morgens Kitchen Billing <MorgensKitchen@pulsexflow.xyz>",
    to,
    cc: "morgenskitchen@gmail.com",
    replyTo: "morgenskitchen@gmail.com",
    subject,
    html,
    attachments,
  });

  if (error) {
    console.error("EMAIL SEND ERROR:", error);
    throw new Error("Email failed to send");
  }

  return data;
}