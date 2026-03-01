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

  const [form, setForm] = useState({
    name: tenant.name,
    email: tenant.email || "",
    phone: tenant.phone || "",
    kitchen_space_id: tenant.kitchen_space_id,
  });

  const [saving, setSaving] = useState(false);

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

    if (!error) {
      setIsActive(!isActive);
    }
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

    if (!error) {
      setIsEditing(false);
    }
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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6">

      {/* Top Row */}
      <div className="flex justify-between items-start">

        <div>
          <Link
            href="/admin/tenants"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
          >
            ← Back to Tenants
          </Link>

          {isEditing ? (
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="text-2xl font-semibold mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-[var(--text)] mt-2">
              {tenant.name}
            </h1>
          )}

          <p className="text-sm text-[var(--text-muted)]">
            Tenant Control Center
          </p>
        </div>

        <span
          className={`px-3 py-1 text-xs rounded-full ${
            isActive
              ? "bg-green-500/15 text-green-600"
              : "bg-red-500/15 text-red-600"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

     {/* Info Row */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">

  {/* Email */}
  <div className="min-w-0">
    <div className="text-[var(--text-muted)] mb-1">Email</div>
    {isEditing ? (
      <input
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
      />
    ) : (
      <div className="text-[var(--text)] break-all">
        {tenant.email || "—"}
      </div>
    )}
  </div>

  {/* Phone */}
  <div className="min-w-0">
    <div className="text-[var(--text-muted)] mb-1">Phone</div>
    {isEditing ? (
      <input
        value={form.phone}
        onChange={(e) =>
          setForm({ ...form, phone: e.target.value })
        }
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
      />
    ) : (
      <div className="text-[var(--text)]">
        {tenant.phone || "—"}
      </div>
    )}
  </div>

  {/* Kitchen */}
  <div className="min-w-0">
    <div className="text-[var(--text-muted)] mb-1">Kitchen</div>
    {isEditing ? (
      <select
        value={form.kitchen_space_id || ""}
        onChange={(e) =>
          setForm({
            ...form,
            kitchen_space_id: e.target.value || null,
          })
        }
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]"
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

  {/* Created */}
  <div className="min-w-0">
    <div className="text-[var(--text-muted)] mb-1">Created</div>
    <div className="text-[var(--text)]">
      {new Date(tenant.created_at).toLocaleDateString()}
    </div>
  </div>

</div>

      {/* Action Row */}
      <div className="flex flex-wrap gap-3">

        <button
          onClick={toggleStatus}
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] transition text-sm"
        >
          {isActive ? "Deactivate Tenant" : "Activate Tenant"}
        </button>

        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[var(--text)] text-[var(--bg)] text-sm"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
          >
            Edit
          </button>
        )}

      </div>
    </div>
  );
}