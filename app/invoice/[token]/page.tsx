import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { notFound } from "next/navigation";
import AutoPrint from "@/components/AutoPrint";
import PrintButton from "@/components/PrintButton";

export const revalidate = 0;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ print?: string }>;
}) {

  console.log("===== PUBLIC INVOICE PAGE START =====");

  /* ---------------- RESOLVE PARAMS ---------------- */

  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  const token = resolvedParams?.token?.trim();

  console.log("Resolved token:", token);

  if (!token) {
    console.error("Token missing -> returning 404");
    return notFound();
  }

  const isPrint = resolvedSearch?.print === "true";

  /* ---------------- FETCH INVOICE ---------------- */

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .select(`
      *,
      tenant:tenants(name),
      invoice_line_items(*),
      payments(*)
    `)
    .eq("public_token", token)
    .maybeSingle();

  console.log("Invoice result:", invoice);
  console.log("Supabase error:", error);

  if (error || !invoice) {
    console.error("Invoice not found for token:", token);
    return notFound();
  }

  /* ---------------- TOTALS ---------------- */

  const total = Number(invoice.total_amount || 0);

  const totalPaid =
    invoice.payments?.reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0
    ) || 0;

  const remaining = total - totalPaid;

  /* ---------------- SORT ITEMS ---------------- */

  const sortedLineItems = [...(invoice.invoice_line_items || [])].sort(
    (a: any, b: any) => {
      const dateA = a.service_date
        ? new Date(a.service_date).getTime()
        : null;

      const dateB = b.service_date
        ? new Date(b.service_date).getTime()
        : null;

      if (dateA && dateB) return dateA - dateB;
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      return (a.description || "").localeCompare(b.description || "");
    }
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto bg-white">

      {isPrint && <AutoPrint />}

      <div className="mb-16 flex items-start justify-between">

        <img
          src="/public/logos/morgens-kitchen-light.svg"
          alt="Morgen's Kitchen"
          style={{ height: "60px" }}
        />

        <div className="text-right">
          <h1 className="text-lg font-semibold tracking-wider">
            {invoice.invoice_number}
          </h1>

          <div className="text-sm text-gray-500 mt-2 space-y-1">
            {invoice.invoice_date && (
              <p>
                Issued:{" "}
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </p>
            )}

            {invoice.due_date && (
              <p>
                Due:{" "}
                {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

      </div>

      <div className="mt-4 mb-24">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
          Bill To
        </p>

        <p className="text-lg font-medium">
          {invoice.tenant?.name}
        </p>
      </div>

      <div className="p-6">

        <table className="w-full text-sm">

          <thead>
            <tr>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">Service Date</th>
              <th className="text-left p-3">Qty</th>
              <th className="text-left p-3">Rate</th>
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>

          <tbody>

            {sortedLineItems.map((item: any) => (
              <tr key={item.id} className="border-t">

                <td className="p-3">{item.description}</td>

                <td className="p-3">
                  {item.service_date
                    ? new Date(item.service_date).toLocaleDateString()
                    : "-"}
                </td>

                <td className="p-3">{item.quantity}</td>

                <td className="p-3">
                  ${Number(item.rate).toFixed(2)}
                </td>

                <td className="p-3 text-right font-medium">
                  ${Number(item.amount).toFixed(2)}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      <div className="p-8 mt-12 flex justify-between text-center">

        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-semibold">
            ${total.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-xl font-semibold text-green-600">
            ${totalPaid.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Balance</p>
          <p className="text-xl font-semibold text-red-600">
            ${remaining.toFixed(2)}
          </p>
        </div>

      </div>

      {!isPrint && <PrintButton />}

    </div>
  );
}