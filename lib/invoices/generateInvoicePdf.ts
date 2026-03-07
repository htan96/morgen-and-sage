import html_to_pdf from "html-pdf-node";

export async function generateInvoicePdf(
  invoiceId: string
): Promise<Buffer> {

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://morgen-and-sage.vercel.app";

  const url = `${baseUrl}/reports/invoice/${invoiceId}?print=true`;

  console.log("Generating invoice PDF from:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch invoice page: ${response.status}`);
  }

  const html = await response.text();

  const pdfBuffer = (await html_to_pdf.generatePdf(
    { content: html },
    {
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    }
  )) as unknown as Buffer;

  console.log("PDF generated successfully");

  return pdfBuffer;
}