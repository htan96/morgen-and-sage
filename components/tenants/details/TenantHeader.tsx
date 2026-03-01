"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Kitchen = {
  id: string;
  name: string;
};

type Props = {
  tenant: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    is_active: boolean;
    kitchen_space_id: string | null;
  };
};

export default function TenantHeader({ tenant }: Props) {
  const supabase = createClient();

  const [isActive, setIsActive] = useState(tenant.is_active);
  const [isEditing, setIsEditing] = useState(false);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: tenant.name,
    email: tenant.email || "",
    phone: tenant.phone || "",
    kitchen_space_id: tenant.kitchen_space_id,
  });

  // Load kitchens
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

  async function toggleStatus() {
    const { error } = await supabase
      .from("tenants")
      .update({ is_active: !isActive })
      .eq("id", tenant.id);

    if (!error) setIsActive(!isActive);
  }

  async function handleSave() {
    setSaving(true);

    const { error } = await supabase
      .from("tenants")
      .update({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        kitchen_space_id: form.kitchen_space_id,
      })
      .eq("id", tenant.id);

    setSaving(false);

    if (!error) setIsEditing(false);
  }

  function handleCancel() {
    setForm({
      name: tenant.name,
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
        className={`grid ${
          isEditing
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-4"
        } gap-8 text-sm`}
      >
        {/* Business Name */}
        <div className="min-w-0">
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
            <div className="text-[var(--text)]">
              {tenant.name}
            </div>
          )}
        </div>

        {/* Email */}
        <div className="min-w-0">
          <div className="text-[var(--text-muted)] mb-2">Email</div>
          {isEditing ? (
            <input
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            />
          ) : (
            <div className="text-[var(--text)] break-all">
              {tenant.email || "—"}
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="min-w-0">
          <div className="text-[var(--text-muted)] mb-2">Phone</div>
          {isEditing ? (
            <input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            />
          ) : (
            <div className="text-[var(--text)]">
              {tenant.phone || "—"}
            </div>
          )}
        </div>

        {/* Kitchen */}
        <div className="min-w-0">
          <div className="text-[var(--text-muted)] mb-2">Kitchen</div>
          {isEditing ? (
            <select
              value={form.kitchen_space_id || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  kitchen_space_id: e.target.value || null,
                })
              }
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            >
              <option value="">Not Assigned</option>
              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-[var(--text)]">
              {kitchens.find(
                (k) => k.id === tenant.kitchen_space_id
              )?.name || "Not Assigned"}
            </div>
          )}
        </div>

        {/* Created (view only) */}
        {!isEditing && (
          <div>
            <div className="text-[var(--text-muted)] mb-2">
              Created
            </div>
            <div className="text-[var(--text)]">
              {new Date(tenant.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* ===================== ACTIONS ===================== */}
      <div className="flex justify-between items-center pt-6 border-t border-[var(--border)]">
        <button
          onClick={toggleStatus}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] transition text-sm"
        >
          {isActive ? "Deactivate Tenant" : "Activate Tenant"}
        </button>

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
  );
}