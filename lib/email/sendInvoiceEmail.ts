import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { sendEmail } from "./sendEmail";
import {
  buildEmailLogoBlockHtml,
  buildEmailSignature,
} from "./emailSignature";

export async function sendInvoiceEmail(invoiceId: string) {

  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select(`
      *,
      tenant:tenants(id,name,email)
    `)
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (!invoice.tenant?.email) {
    throw new Error("Tenant email missing.");
  }

  const invoiceUrl =
`${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}?print=true`;

  const html = `
  <div style="
      font-family: Arial, Helvetica, sans-serif;
      background:#f5f5f5;
      padding:40px 20px;
  ">

    <div style="
        max-width:600px;
        margin:auto;
        background:white;
        padding:30px;
        border-radius:8px;
        border:1px solid #e6e6e6;
    ">

      ${buildEmailLogoBlockHtml()}

      <h2 style="
          margin-top:0;
          color:#111;
          font-weight:600;
      ">
        Invoice ${invoice.invoice_number}
      </h2>

      <p style="color:#333">
        Hello ${invoice.tenant?.name},
      </p>

      <p style="color:#333">
        Your invoice is ready. Click the button below to view or download it.
      </p>

      <div style="margin:30px 0">
        <a
          href="${invoiceUrl}"
          style="
            display:inline-block;
            background:#000;
            color:white;
            padding:12px 22px;
            border-radius:6px;
            text-decoration:none;
            font-weight:600;
          "
        >
          View Invoice
        </a>
      </div>

      <p style="
          font-size:13px;
          color:#777;
          margin-top:20px;
      ">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>

      <p style="
          font-size:13px;
          word-break:break-all;
          color:#555;
      ">
        ${invoiceUrl}
      </p>

      ${buildEmailSignature()}

    </div>

  </div>
  `;

  /* ---------------- SEND EMAIL ---------------- */

  await sendEmail({
    organizationId: invoice.organization_id,
    to: invoice.tenant.email,
    subject: `Invoice ${invoice.invoice_number}`,
    html,
  });

  /* ---------------- UPDATE INVOICE STATUS ---------------- */

  const expires = new Date();
  expires.setDate(expires.getDate() + 90);

  await supabaseAdmin
    .from("invoices")
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      token_expires_at: expires.toISOString(),
    })
    .eq("id", invoiceId);

}