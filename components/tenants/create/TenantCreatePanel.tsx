"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import TenantForm from "./TenantForm";

const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function TenantCreatePanel({
  open,
  onClose,
  onCreated,
}: Props) {
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingType, setBillingType] =
    useState<"standard" | "commissary">("standard");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setPhone("");
    setBillingType("standard");
    setActive(true);
    setLoading(false);
  }, [open]);

  async function handleCreate() {
    if (!name.trim() || loading) return;

    setLoading(true);

    const { error } = await supabase.from("tenants").insert({
      organization_id: ORG_ID,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      billing_type: billingType,
      is_active: active,
    });

    setLoading(false);

    if (error) {
      console.error("Create tenant error:", error);
      return;
    }

    onCreated();
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[520px] max-w-[95vw] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-[var(--border)]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">
                Add Tenant
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Create a new kitchen client.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--bg)] transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <TenantForm
            name={name}
            email={email}
            phone={phone}
            billingType={billingType}
            active={active}
            onChange={(field, value) => {
              if (field === "name") setName(String(value));
              if (field === "email") setEmail(String(value));
              if (field === "phone") setPhone(String(value));
              if (field === "billingType") setBillingType(value);
              if (field === "active") setActive(Boolean(value));
            }}
          />
        </div>

        {/* Footer */}
<div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--surface)]">
  <div className="flex justify-end gap-3">

    <button
      type="button"
      onClick={onClose}
      className="ui-btn ui-btn-cancel"
    >
      Cancel
    </button>

    <button
      type="button"
      onClick={handleCreate}
      disabled={!name.trim() || loading}
      className="ui-btn-filled-save"
    >
      {loading ? "Saving..." : "Save Tenant"}
    </button>

  </div>
</div>
      </div>
    </div>,
    document.body
  );
}