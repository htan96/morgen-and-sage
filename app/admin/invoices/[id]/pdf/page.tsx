import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      tenant:tenants(name),
      invoice_line_items(*),
      payments(*)
    `)
    .eq("id", id)
    .single();

  if (!invoice || error) return notFound();

  const total = Number(invoice.total_amount);

  return (
    <div className="min-h-screen bg-white text-black px-4 sm:px-8 md:px-12 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8 mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Morgen & Sage
            </h1>
            <p className="text-sm mt-2">
              Commercial Kitchen
            </p>
          </div>

          <div className="sm:text-right">
            <h2 className="text-lg md:text-xl font-semibold">
              Invoice
            </h2>
            <p className="mt-2">
              #{invoice.invoice_number}
            </p>
            <p>
              {new Date(invoice.invoice_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <p className="font-semibold">
            Bill To:
          </p>
          <p>
            {invoice.tenant?.name}
          </p>
        </div>

        {/* Line Items */}
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">
                  Description
                </th>
                <th className="text-left">
                  Service Date
                </th>
                <th className="text-left">
                  Qty
                </th>
                <th className="text-left">
                  Rate
                </th>
                <th className="text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {invoice.invoice_line_items.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="py-3">
                    {item.description}
                  </td>
                  <td>
                    {item.service_date
                      ? new Date(
                          item.service_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {item.quantity}
                  </td>
                  <td>
                    ${Number(item.rate).toFixed(2)}
                  </td>
                  <td className="text-right font-medium">
                    ${Number(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end mt-10">
          <div className="w-full sm:w-64">
            <div className="flex justify-between py-2 font-semibold">
              <span>Total</span>
              <span>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}