import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

export async function generateInvoicePdf(invoiceId: string) {

  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {

    const page = await browser.newPage();

    await page.goto(
      `${process.env.NEXT_PUBLIC_APP_URL}/reports/invoice/${invoiceId}?print=true`,
      { waitUntil: "domcontentloaded" }
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return Buffer.from(pdf);

  } finally {
    await browser.close();
  }
}