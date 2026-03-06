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

    /* ------------------------------------------------ */
    /* Resolve Base URL                                 */
    /* ------------------------------------------------ */

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://morgen-and-sage.vercel.app";

    const url = `${baseUrl}/reports/invoice/${invoiceId}?print=true`;

    console.log("📄 Generating invoice PDF");
    console.log("Invoice ID:", invoiceId);
    console.log("URL:", url);

    /* ------------------------------------------------ */
    /* Load Page                                        */
    /* ------------------------------------------------ */

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const status = response?.status();

    console.log("Response Status:", status);

    if (!response) {
      throw new Error("No response received when loading invoice page.");
    }

    if (status && status >= 400) {

      console.log("⚠️ Page returned error status");

      const html = await page.content();

      console.log("----- PAGE HTML START -----");
      console.log(html.slice(0, 1500)); // first part of page
      console.log("----- PAGE HTML END -----");

      throw new Error(`Unexpected status code: ${status}`);
    }

    /* ------------------------------------------------ */
    /* Wait for render                                  */
    /* ------------------------------------------------ */

    await page.waitForSelector("body");

    /* ------------------------------------------------ */
    /* Generate PDF                                     */
    /* ------------------------------------------------ */

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log("✅ PDF generated successfully");

    return Buffer.from(pdf);

  } catch (error) {

    console.error("❌ PDF generation failed:", error);
    throw error;

  } finally {

    await browser.close();

  }
}