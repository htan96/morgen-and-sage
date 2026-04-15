"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TenantForm from "./TenantForm";

const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type ServiceRow = {
  id: string;
  name: string;
  default_amount: number;
  default_frequency: string;
};

export default function TenantCreatePanel({ open, onClose, onCreated }: Props) {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingType, setBillingType] =
    useState<"standard" | "commissary">("standard");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setBillingType("standard");
    setActive(true);
    setLoading(false);
  }, [open]);

  async function seedDefaultServices(tenantId: string, type: "standard" | "commissary") {
    // Decide which services to add
    const serviceNames =
      type === "commissary"
        ? ["Commissary Address Fee"]
        : ["Kitchen Time", "Cleaning Fee"];

    // Fetch services by name (recommended: switch to slug/code later)
    const { data: services, error: svcErr } = await supabase
      .from("services")
      .select("id, name, default_amount, default_frequency")
      .in("name", serviceNames);

    if (svcErr) {
      console.error("Seed services lookup failed:", {
        message: svcErr.message,
        details: (svcErr as any).details,
        code: (svcErr as any).code,
      });
      throw svcErr;
    }

    const typed = (services || []) as ServiceRow[];

    // Ensure all required services were found
    const missing = serviceNames.filter((n) => !typed.some((s) => s.name === n));
    if (missing.length) {
      console.error("Missing required service definitions:", missing);
      throw new Error(`Missing services: ${missing.join(", ")}`);
    }

    // Build tenant_services rows from service defaults
    const rows = typed.map((s) => ({
      tenant_id: tenantId,
      service_id: s.id,
      amount: s.default_amount,
      frequency: s.default_frequency, // or override here if you want
      quantity: 1,
      is_active: true,
    }));

    const { error: insErr } = await supabase.from("tenant_services").insert(rows);
    if (insErr) {
      console.error("Seed tenant_services insert failed:", {
        message: insErr.message,
        details: (insErr as any).details,
        code: (insErr as any).code,
      });
      throw insErr;
    }
  }

  async function handleCreate() {
    if (!name.trim() || loading) return;
    setLoading(true);

    // 1) Create tenant (return row so we get ID)
    const { data: tenant, error } = await supabase
      .from("tenants")
      .insert({
        organization_id: ORG_ID,
        name: name.trim(),
        contact_name: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        is_active: active,
        // Optional: store billing_type if you add column (recommended)
        // billing_type: billingType,
      })
      .select("id")
      .single();

    if (error || !tenant?.id) {
      console.error("Create tenant error:", {
        message: error?.message,
        details: (error as any)?.details,
        code: (error as any)?.code,
      });
      setLoading(false);
      return;
    }

    // 2) Seed default services based on billing type
    try {
      await seedDefaultServices(tenant.id, billingType);
    } catch (e) {
      // If seeding fails, you can decide if you want to delete the tenant
      // or keep it and let admin fix manually. For now we just stop + log.
      console.error("Tenant created but seeding failed:", e);
      setLoading(false);
      return;
    }

    setLoading(false);
    onCreated();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
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
        className={`absolute right-0 top-0 h-full w-[520px] max-w-[95vw] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300`}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-[var(--border)]">
          <div className="flex justify-between">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <TenantForm
            name={name}
            contactName={contactName}
            email={email}
            phone={phone}
            billingType={billingType}
            active={active}
            onChange={(field, value) => {
              if (field === "name") setName(String(value));
              if (field === "contact_name") setContactName(String(value));
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
    </div>
  );
}