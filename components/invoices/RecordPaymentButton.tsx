"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign } from "lucide-react";

export default function RecordPaymentButton({
  invoiceId,
  tenantId,
  organizationId,
}: {
  invoiceId: string;
  tenantId: string;
  organizationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (open) {
      setPaymentDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          tenantId,
          organizationId,
          amount: Number(amount),
          method,
          notes,
          paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await res.json();

      console.log("Payment API response:", data);

      if (!res.ok) {
        alert(data.error || "Payment failed");
        return;
      }

      setOpen(false);
      setAmount("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setMethod("cash");
      router.refresh();
    } catch (err) {
      console.error("Payment request failed:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <DollarSign size={16} />
        Record
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div
            className="rounded-2xl p-6 w-96"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">
              Record Payment
            </h2>

            <div className="mb-3">
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded border"
            />

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded border"
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="zelle">Zelle</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>

            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded border"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => !loading && setOpen(false)}
                className="px-3 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium transition"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}