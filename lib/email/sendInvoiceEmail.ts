import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { sendEmail } from "./sendEmail";
import { generateInvoicePdf } from "@/lib/invoices/generateInvoicePdf";

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

  const pdf = await generateInvoicePdf(invoice.id);

  const html = `
  <div style="font-family:Arial;max-width:600px">

    <img src="${process.env.NEXT_PUBLIC_APP_URL}/logos/morgens-kitchen-dark.svg" width="110"/>

    <h2>Invoice ${invoice.invoice_number}</h2>

    <p>Hello ${invoice.tenant?.name},</p>

    <p>Your invoice is attached.</p>

    <p>Thank you.</p>

  </div>
  `;

  await sendEmail({
    organizationId: invoice.organization_id,
    to: invoice.tenant.email,
    subject: `Invoice ${invoice.invoice_number}`,
    html,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: pdf,
      },
    ],
  });

}