import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { sendEmail } from "./sendEmail";
import { buildInvoicePdfAttachment } from "./buildInvoicePdfAttachment";
import {
  buildEmailLogoBlockHtml,
  buildEmailSignature,
} from "./emailSignature";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTenantMessageHtml(message: string) {
  const formattedMessage = escapeHtml(message).replace(/\n/g, "<br/>");

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f5f5f5; padding:40px 20px;">
    <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px; border:1px solid #e6e6e6;">
      ${buildEmailLogoBlockHtml()}
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color:#333; font-size:15px;">
        ${formattedMessage}
        ${buildEmailSignature()}
      </div>
    </div>
  </div>`;
}

/**
 * Plain tenant email via the same Gmail / Resend path as invoices.
 * Optional PDF attachment when invoiceId is set.
 */
export async function sendTenantMessageEmail(params: {
  tenantId: string;
  to: string;
  subject: string;
  message: string;
  invoiceId?: string | null;
}) {
  const { tenantId, to, subject, message, invoiceId } = params;

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .select("id, name, email, organization_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!tenant?.organization_id) {
    throw new Error("Tenant is missing organization_id");
  }

  const attachments: { filename: string; content: Buffer }[] = [];

  if (invoiceId) {
    attachments.push(
      await buildInvoicePdfAttachment(invoiceId, tenantId)
    );
  }

  const subjectLine = subject.trim() || "(No subject)";

  await sendEmail({
    organizationId: tenant.organization_id,
    to: to.trim(),
    subject: subjectLine,
    html: buildTenantMessageHtml(message),
    attachments,
  });
}
