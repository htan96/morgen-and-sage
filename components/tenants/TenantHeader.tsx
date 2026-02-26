"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type Props = {
  tenant: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    is_active: boolean;
  };
};

export default function TenantHeader({ tenant }: Props) {
  const supabase = createClient();
  const [isActive, setIsActive] = useState(tenant.is_active);

  async function toggleStatus() {
    const { error } = await supabase
      .from("tenants")
      .update({ is_active: !isActive })
      .eq("id", tenant.id);

    if (!error) {
      setIsActive(!isActive);
    }
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

          <h1 className="text-2xl font-semibold text-[var(--text)] mt-2">
            {tenant.name}
          </h1>

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">

        <div>
          <div className="text-[var(--text-muted)]">Email</div>
          <div className="text-[var(--text)]">{tenant.email || "—"}</div>
        </div>

        <div>
          <div className="text-[var(--text-muted)]">Phone</div>
          <div className="text-[var(--text)]">{tenant.phone || "—"}</div>
        </div>

        <div>
          <div className="text-[var(--text-muted)]">Created</div>
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

        <button
          disabled
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm opacity-60 cursor-not-allowed"
        >
          Generate Next Month Bookings
        </button>

        <button
          disabled
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm opacity-60 cursor-not-allowed"
        >
          Generate Monthly Invoice
        </button>

      </div>

    </div>
  );
}