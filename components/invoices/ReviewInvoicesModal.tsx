"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Invoice = {
  id: string;
  invoice_number: string;
  total_amount: number;
  tenant?: {
    id: string;
    name: string;
  } | null;
};

type Props = {
  invoices: Invoice[];
  onClose: () => void;
};

export default function ReviewInvoicesModal({
  invoices,
  onClose,
}: Props) {

  const router = useRouter();

  const [selected, setSelected] = useState<Invoice | null>(
    invoices?.[0] ?? null
  );

  const [sending, setSending] = useState(false);

  if (!invoices || invoices.length === 0) {
    return null;
  }

  /* ---------------- SEND SINGLE ---------------- */

  async function sendInvoice(id: string) {

    if (sending) return;

    setSending(true);

    try {

      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to send invoice");
        return;
      }

      router.refresh();

    } catch (err) {

      console.error("Send invoice failed:", err);
      alert("Failed to send invoice");

    } finally {
      setSending(false);
    }
  }

  /* ---------------- SEND ALL ---------------- */

      async function sendAll() {

        if (sending) return;

        setSending(true);

        let failed = 0;

        try {

          for (const inv of invoices) {

            const res = await fetch("/api/invoices/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                invoiceId: inv.id,
              }),
            });

            if (!res.ok) {
              failed++;
            }

          }

          if (failed > 0) {
            alert(`${failed} invoices failed to send`);
          }

          router.refresh();
          onClose();

        } catch (err) {

          console.error("Batch send failed:", err);
          alert("Batch send failed");

        } finally {
          setSending(false);
        }
      }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div
        className="w-[1200px] h-[750px] rounded-xl flex overflow-hidden shadow-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >

        {/* LEFT PANEL */}

        <div
          className="w-[340px] overflow-y-auto"
          style={{
            borderRight: "1px solid var(--border)",
          }}
        >
          <div
            className="p-4 font-semibold"
            style={{
              borderBottom: "1px solid var(--border)",
            }}
          >
            Review Draft Invoices ({invoices.length})
          </div>

          {invoices.map((inv) => (

            <div
              key={inv.id}
              onClick={() => setSelected(inv)}
              className="p-4 cursor-pointer transition"
              style={{
                borderBottom: "1px solid var(--border)",
                background:
                  selected?.id === inv.id
                    ? "var(--hover)"
                    : "transparent",
              }}
            >

              <div className="font-medium">
                {inv.tenant?.name ?? "Unknown Tenant"}
              </div>

              <div
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {inv.invoice_number}
              </div>

              <div className="text-sm font-semibold mt-1">
                ${Number(inv.total_amount).toFixed(2)}
              </div>

            </div>

          ))}
        </div>

        {/* RIGHT PANEL */}

        <div className="flex-1 flex flex-col">

          {/* HEADER */}

          <div
            className="flex justify-between items-center p-4"
            style={{
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="font-medium">
              Invoice Preview
            </div>

            <div className="flex gap-3">

              <button
                disabled={!selected || sending}
                onClick={() => selected && sendInvoice(selected.id)}
                className="px-3 py-1 rounded text-white disabled:opacity-50"
                style={{ background: "#16a34a" }}
              >
                {sending ? "Sending..." : "Send"}
              </button>

              <button
                disabled={sending}
                onClick={sendAll}
                className="px-3 py-1 rounded text-white disabled:opacity-50"
                style={{ background: "#000" }}
              >
                {sending ? "Sending..." : "Send All"}
              </button>

              <button
                onClick={onClose}
                className="px-3 py-1 rounded"
                style={{
                  background: "var(--hover)",
                  border: "1px solid var(--border)",
                }}
              >
                Close
              </button>

            </div>
          </div>

          {/* PREVIEW */}

          {selected && (
            <iframe
              key={selected.id}
              src={`/reports/invoice/${selected.id}`}
              className="w-full flex-1 border-0 bg-white"
            />
          )}

        </div>
      </div>
    </div>
  );
}