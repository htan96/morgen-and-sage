import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

export async function generateInvoicePdf(invoiceId: string) {

  const executablePath = await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar"
  );

  const browser = await playwright.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });

  try {

    const page = await browser.newPage();

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://morgen-and-sage.vercel.app";

    const url = `${baseUrl}/reports/invoice/${invoiceId}?print=true`;

    console.log("Generating invoice PDF:", url);

    await page.goto(url, {
      waitUntil: "networkidle",
    });

    // wait for invoice table instead of body
    await page.waitForSelector("table");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log("PDF generated successfully");

    return Buffer.from(pdf);

  } catch (err) {

    console.error("PDF generation failed:", err);
    throw err;

  } finally {

    await browser.close();

  }
}