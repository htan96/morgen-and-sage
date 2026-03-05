export function generateInvoiceNumber(billingMonth: string) {

  const month = new Date(`${billingMonth}T00:00:00Z`)
    .toLocaleString("en-US", {
      month: "short",
      year: "numeric"
    })
    .replace(" ", "")
    .toUpperCase();

  const random =
    Math.floor(1000 + Math.random() * 9000);

  return `INV-${month}-${random}`;
}