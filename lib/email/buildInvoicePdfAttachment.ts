import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

function sanitizePdfText(s: string, maxLen = 2000) {
  return (s || "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")
    .slice(0, maxLen);
}

/**
 * Simple invoice PDF for email attachment (same data as portal invoice, compact layout).
 */
export async function buildInvoicePdfAttachment(
  invoiceId: string,
  expectedTenantId: string
): Promise<{ filename: string; content: Buffer }> {
  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .select(
      `
      id,
      invoice_number,
      invoice_date,
      due_date,
      subtotal,
      total_amount,
      status,
      tenant_id,
      tenant:tenants(name),
      invoice_line_items(description, quantity, rate, amount)
    `
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) throw error;

  if (!invoice || invoice.tenant_id !== expectedTenantId) {
    throw new Error("Invoice not found or does not belong to this tenant");
  }

  const tenantName =
    (invoice as { tenant?: { name?: string } }).tenant?.name || "Tenant";

  type LineRow = { description?: string; quantity?: number; rate?: number; amount?: number };

  const rawItems = (invoice as { invoice_line_items?: LineRow[] }).invoice_line_items || [];

  const items = [...rawItems].sort((a, b) =>
    (a.description || "").localeCompare(b.description || "")
  );

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([612, 792]);
  const margin = 48;
  let y = 744;

  const draw = (text: string, opts?: { bold?: boolean; size?: number }) => {
    const size = opts?.size ?? 10;
    const f = opts?.bold ? fontBold : font;
    const lines = sanitizePdfText(text).split("\n");
    for (const line of lines) {
      if (y < margin + 40) {
        page = doc.addPage([612, 792]);
        y = 744;
      }
      page.drawText(line.length > 95 ? `${line.slice(0, 92)}...` : line, {
        x: margin,
        y,
        size,
        font: f,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= size + 4;
    }
  };

  draw("Morgen & Sage — Invoice", { bold: true, size: 16 });
  y -= 8;
  draw(`Invoice #: ${sanitizePdfText(String(invoice.invoice_number))}`, {
    bold: true,
    size: 12,
  });
  draw(`Tenant: ${sanitizePdfText(tenantName)}`);
  draw(`Status: ${sanitizePdfText(String(invoice.status || ""))}`);
  if (invoice.invoice_date) {
    draw(`Invoice date: ${String(invoice.invoice_date).slice(0, 10)}`);
  }
  if (invoice.due_date) {
    draw(`Due date: ${String(invoice.due_date).slice(0, 10)}`);
  }
  y -= 8;
  draw("Line items", { bold: true, size: 11 });
  y -= 4;

  for (const row of items) {
    const desc = sanitizePdfText(String(row.description || "Item"), 80);
    const qty = Number(row.quantity ?? 0);
    const rate = Number(row.rate ?? 0);
    const amt = Number(row.amount ?? 0);
    draw(`${desc}`);
    draw(`  Qty ${qty.toFixed(2)} @ $${rate.toFixed(2)} = $${amt.toFixed(2)}`, { size: 9 });
  }

  y -= 8;
  draw(`Subtotal: $${Number(invoice.subtotal || 0).toFixed(2)}`);
  draw(`Total: $${Number(invoice.total_amount || 0).toFixed(2)}`, { bold: true, size: 12 });

  const pdfBytes = await doc.save();
  const num = sanitizePdfText(String(invoice.invoice_number)).replace(/[^a-zA-Z0-9-_]/g, "_");

  return {
    filename: `Invoice-${num}.pdf`,
    content: Buffer.from(pdfBytes),
  };
}
