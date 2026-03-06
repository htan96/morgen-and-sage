import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function generateInvoicePdf(invoiceId: string) {

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(
    `${process.env.NEXT_PUBLIC_APP_URL}/reports/invoice/${invoiceId}?print=true`,
    { waitUntil: "networkidle0" }
  );

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  return Buffer.from(pdf);
}