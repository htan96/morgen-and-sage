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

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/reports/invoice/${invoiceId}?print=true`;

    console.log("Generating invoice PDF from:", url);

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    if (!response) {
      throw new Error("No response received when loading invoice page.");
    }

    if (response.status() >= 400) {
      throw new Error(`Invoice page returned status ${response.status()}`);
    }

    // wait for page to fully render
    await page.waitForSelector("body");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return Buffer.from(pdf);

  } catch (error) {

    console.error("PDF generation failed:", error);
    throw error;

  } finally {

    await browser.close();

  }
}