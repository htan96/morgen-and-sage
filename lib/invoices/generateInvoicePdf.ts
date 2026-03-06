import { chromium } from "playwright";

export async function generateInvoicePdf(invoiceId: string) {

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
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