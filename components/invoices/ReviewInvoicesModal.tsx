"use client";

import { useState } from "react";

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

export default function ReviewInvoicesModal({ invoices, onClose }: Props) {
  const [selected, setSelected] = useState<Invoice | null>(
    invoices?.[0] ?? null
  );

  const [sending, setSending] = useState(false);

  if (!invoices || invoices.length === 0) return null;

  /* ---------------------------------- */
  /* Send Single Invoice                */
  /* ---------------------------------- */

  async function sendInvoice(id: string) {
    setSending(true);

    try {
      await fetch("/api/invoices/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId: id }),
      });
    } catch (err) {
      console.error("Send invoice failed:", err);
    } finally {
      setSending(false);
    }
  }

  /* ---------------------------------- */
  /* Send All Invoices                  */
  /* ---------------------------------- */

  async function sendAll() {
    setSending(true);

    try {
      await Promise.all(
        invoices.map((inv) =>
          fetch("/api/invoices/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ invoiceId: inv.id }),
          })
        )
      );
    } catch (err) {
      console.error("Batch send failed:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div
        className="w-[1100px] h-[700px] rounded-xl flex overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >

        {/* LEFT PANEL */}
        <div
          className="w-[320px] overflow-y-auto"
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
                {inv.tenant?.name}
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
                Send
              </button>

              <button
                disabled={sending}
                onClick={sendAll}
                className="px-3 py-1 rounded text-white disabled:opacity-50"
                style={{ background: "#000" }}
              >
                Send All
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
          <div className="flex-1 bg-white">
            {selected ? (
              <iframe
                key={selected.id}
                src={`/reports/invoice/${selected.id}`}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                Select an invoice to preview
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}