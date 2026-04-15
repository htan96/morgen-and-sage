"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreatePortalUserButton from "@/components/tenants/actions/CreatePortalUserButton";
import TenantMessageModal from "@/components/tenants/actions/TenantMessageModal";

type Kitchen = {
  id: string;
  name: string;
};

type Props = {
  tenant: {
    id: string;
    name: string;
    contact_name?: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
    is_active: boolean;
    kitchen_space_id: string | null;
  };
};

export default function TenantHeader({ tenant }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isActive, setIsActive] = useState(tenant.is_active);
  const [isEditing, setIsEditing] = useState(false);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [saving, setSaving] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  const [form, setForm] = useState({
    name: tenant.name,
    contact_name: tenant.contact_name || "",
    email: tenant.email || "",
    phone: tenant.phone || "",
    kitchen_space_id: tenant.kitchen_space_id,
  });

  useEffect(() => {
    if (isEditing) return;
    setForm({
      name: tenant.name,
      contact_name: tenant.contact_name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      kitchen_space_id: tenant.kitchen_space_id,
    });
  }, [tenant, isEditing]);

  /* ---------------- Load Kitchens ---------------- */

  useEffect(() => {
    async function loadKitchens() {
      const { data } = await supabase
        .from("kitchen_spaces")
        .select("id, name")
        .order("name");

      setKitchens(data || []);
    }

    loadKitchens();
  }, []);

  /* ---------------- Toggle Tenant Status ---------------- */

  async function toggleStatus() {
    const { error } = await supabase
      .from("tenants")
      .update({ is_active: !isActive })
      .eq("id", tenant.id);

    if (!error) setIsActive(!isActive);
  }

  /* ---------------- Save Edits ---------------- */

  async function handleSave() {
    console.log("[TenantHeader] save start", { tenantId: tenant.id, form });

    setSaving(true);

    const { error } = await supabase
      .from("tenants")
      .update({
        name: form.name,
        contact_name: form.contact_name.trim() || null,
        email: form.email || null,
        phone: form.phone || null,
        kitchen_space_id: form.kitchen_space_id,
      })
      .eq("id", tenant.id);

    setSaving(false);

    if (error) {
      console.error("[TenantHeader] save error", error);
      alert(error.message || "Could not save tenant.");
      return;
    }

    console.log("[TenantHeader] save ok");
    setIsEditing(false);
    router.refresh();
  }

  /* ---------------- Cancel Editing ---------------- */

  function handleCancel() {
    setForm({
      name: tenant.name,
      contact_name: tenant.contact_name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      kitchen_space_id: tenant.kitchen_space_id,
    });

    setIsEditing(false);
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 space-y-8">

      {/* ===================== HEADER ===================== */}

      <div className="flex justify-between items-start">
        <div className="space-y-2">

          <Link
            href="/admin/tenants"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
          >
            ← Back to Tenants
          </Link>

          <h1 className="text-3xl font-semibold text-[var(--text)]">
            {tenant.name}
          </h1>

          <p className="text-sm text-[var(--text-muted)]">
            Tenant Control Center
          </p>

        </div>

        <span
          className={`px-4 py-1.5 text-xs rounded-full font-medium ${
            isActive
              ? "bg-green-500/15 text-green-600"
              : "bg-red-500/15 text-red-600"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* ===================== INFO GRID ===================== */}

      <div
        className={`grid gap-8 text-sm ${
          isEditing
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >

        {/* Business Name */}

        <div>
          <div className="text-[var(--text-muted)] mb-2">
            Business Name
          </div>

          {isEditing ? (
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            />
          ) : (
            <div>{tenant.name}</div>
          )}
        </div>

        {/* Contact Name */}

        <div>
          <div className="text-[var(--text-muted)] mb-2">
            Contact Name
          </div>

          {isEditing ? (
            <input
              value={form.contact_name || ""}
              onChange={(e) =>
                setForm({ ...form, contact_name: e.target.value })
              }
              placeholder="Enter primary contact name"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            />
          ) : (
            <div className="break-all">
              {tenant.contact_name || tenant.email || "—"}
            </div>
          )}
        </div>

        {/* Email */}

        <div>
          <div className="text-[var(--text-muted)] mb-2">
            Email
          </div>

          {isEditing ? (
            <input
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3"
            />
          ) : (
            <div className="break-all">
              {tenant.email || "—"}
            </div>
          )}
        </div>

        {/* Phone */}

        <div>
          <div className="text-[var(--text-muted)] mb-2">
            Phone
          </div>

          {isEditing ? (
            <input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3"
            />
          ) : (
            <div>{tenant.phone || "—"}</div>
          )}
        </div>

        {/* Kitchen */}

        <div>
          <div className="text-[var(--text-muted)] mb-2">
            Kitchen
          </div>

          {isEditing ? (
            <select
              value={form.kitchen_space_id || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  kitchen_space_id: e.target.value || null,
                })
              }
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3"
            >
              <option value="">Not Assigned</option>

              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          ) : (
            <div>
              {kitchens.find(
                (k) => k.id === tenant.kitchen_space_id
              )?.name || "Not Assigned"}
            </div>
          )}
        </div>

        {/* Created */}

        {!isEditing && (
          <div>
            <div className="text-[var(--text-muted)] mb-2">
              Created
            </div>

            <div>
              {new Date(tenant.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* ===================== ACTIONS ===================== */}

      <div className="pt-6 border-t border-[var(--border)]">

        <div className="flex flex-wrap justify-between gap-4">

          {/* Left Buttons */}

          <div className="flex flex-wrap gap-3">

            <button
              onClick={toggleStatus}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] transition text-sm"
            >
              {isActive ? "Deactivate Tenant" : "Activate Tenant"}
            </button>

            <CreatePortalUserButton
              tenantId={tenant.id}
              email={tenant.email}
            />

            <button
              type="button"
              onClick={() => setMessageOpen(true)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] transition text-sm"
            >
              Message Tenant
            </button>

          </div>

          {/* Right Buttons */}

          {isEditing ? (
            <div className="flex gap-3">

              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[var(--text)] text-[var(--bg)] text-sm font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm"
            >
              Edit
            </button>
          )}

        </div>

      </div>

      <TenantMessageModal
        tenantEmail={tenant.email || ""}
        tenantName={tenant.name}
        tenantId={tenant.id}
        contactName={tenant.contact_name}
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
      />

    </div>
  );
}