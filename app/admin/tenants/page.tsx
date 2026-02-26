"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  is_active: boolean;
};

export default function TenantsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newActive, setNewActive] = useState(false);

  const fetchTenants = async () => {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setTenants(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filteredTenants = tenants
    .filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((t) => {
      if (statusFilter === "active") return t.is_active;
      if (statusFilter === "inactive") return !t.is_active;
      return true;
    });

  const handleCreateTenant = async () => {
    if (!newName.trim()) return;

    await supabase.from("tenants").insert({
      organization_id: ORG_ID,
      name: newName,
      email: newEmail || null,
      phone: newPhone || null,
      is_active: newActive,
    });

    setShowModal(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewActive(false);

    fetchTenants();
  };

  if (loading) {
    return (
      <div className="px-4 py-10 text-[var(--text)]">
        Loading tenants...
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text)]">
            Tenants
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage kitchen clients and billing
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)] transition"
        >
          + Add Tenant
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-40 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTenants.map((tenant) => (
          <div
            key={tenant.id}
            onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
            className="cursor-pointer border border-[var(--border)] rounded-xl p-6 bg-[var(--surface)] hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {tenant.name}
              </h2>

              <span className="text-xs px-2 py-1 rounded-full bg-[var(--hover)] text-[var(--text-muted)]">
                {tenant.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 text-sm text-[var(--text-muted)]">
              Created:{" "}
              {new Date(tenant.created_at).toLocaleDateString()}
            </div>

            <div className="mt-6 text-sm font-medium text-[var(--text)]">
              View Details →
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[var(--bg)]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 sm:p-8 w-full max-w-md space-y-6 mx-4">

            <h2 className="text-lg font-semibold text-[var(--text)]">
              Add Tenant
            </h2>

            <div className="space-y-4">
              <input
                placeholder="Business Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
              />

              <input
                placeholder="Email (optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
              />

              <input
                placeholder="Phone (optional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
              />

              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={newActive}
                  onChange={(e) => setNewActive(e.target.checked)}
                />
                Active
              </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)]"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateTenant}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[var(--hover)] text-[var(--text)]"
              >
                Create
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}