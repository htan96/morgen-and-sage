"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type InvoiceOption = {
  id: string;
  invoice_number: string;
  invoice_date: string | null;
};

type Props = {
  tenantEmail: string;
  tenantName: string;
  tenantId: string;
  contactName?: string | null;
  open: boolean;
  onClose: () => void;
};

export default function TenantMessageModal({
  tenantEmail,
  tenantName,
  tenantId,
  contactName,
  open,
  onClose,
}: Props) {
  const supabase = createClient();
  const prevOpenRef = useRef(false);

  const [to, setTo] = useState(tenantEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* Seed form + greeting only when the modal transitions to open (not while typing). */
  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }

    const justOpened = !prevOpenRef.current;
    prevOpenRef.current = true;

    if (!justOpened) {
      return;
    }

    const greetingName =
      (contactName && String(contactName).trim()) || tenantName;

    setTo(tenantEmail);
    setSubject("");
    setMessage(`Hi ${greetingName},\n\n`);
    setInvoiceId("");
    setToast(null);
  }, [open, tenantEmail, tenantName, contactName]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoadingList(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date")
        .eq("tenant_id", tenantId)
        .order("invoice_date", { ascending: false });

      if (!cancelled) {
        if (error) {
          console.error("Invoice list:", error);
          setInvoices([]);
        } else {
          setInvoices(data || []);
        }
        setLoadingList(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [open, tenantId, supabase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSend() {
    if (!to.trim()) {
      setToast({ type: "error", text: "Recipient email is required." });
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          to: to.trim(),
          subject: subject.trim(),
          message,
          invoiceId: invoiceId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({
          type: "error",
          text: data?.error || "Failed to send message.",
        });
        return;
      }

      setToast({ type: "success", text: "Message sent." });
      setTimeout(() => onClose(), 600);
    } catch (e) {
      console.error(e);
      setToast({ type: "error", text: "Network error. Try again." });
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-message-title"
      onClick={onClose}
    >
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-3 rounded-xl text-sm shadow-lg max-w-md text-center"
          style={{
            background:
              toast.type === "success"
                ? "rgba(34,197,94,0.15)"
                : "rgba(239,68,68,0.15)",
            border:
              toast.type === "success"
                ? "1px solid rgba(34,197,94,0.35)"
                : "1px solid rgba(239,68,68,0.35)",
            color: "var(--text)",
          }}
        >
          {toast.text}
        </div>
      )}

      <div
        className="w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-xl"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2
              id="tenant-message-title"
              className="text-lg font-semibold text-[var(--text)]"
            >
              Message tenant
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {tenantName}
              {contactName?.trim() ? (
                <span className="text-[var(--text-muted)]">
                  {" "}
                  · {contactName.trim()}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1 rounded-lg text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[var(--text-muted)]">To</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm bg-[var(--bg)] text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[var(--text-muted)]">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-xl border px-4 py-3 text-sm bg-[var(--bg)] text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[var(--text-muted)]">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Write your message…"
            className="w-full rounded-xl border px-4 py-3 text-sm bg-[var(--bg)] text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y min-h-[140px]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[var(--text-muted)]">
            Attach invoice (optional)
          </label>
          <select
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            disabled={loadingList}
            className="w-full rounded-xl border px-4 py-3 text-sm bg-[var(--bg)] text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">None</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoice_number}
                {inv.invoice_date
                  ? ` — ${new Date(inv.invoice_date).toLocaleDateString()}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-5 py-2.5 rounded-xl text-sm border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--hover)] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
