"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TenantCard from "../../../components/tenants/lists/TenantCard";
import TenantCreatePanel from "../../../components/tenants/create/TenantCreatePanel";

const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

export type Tenant = {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  billing_type: "standard" | "commissary";
};

export default function TenantsPage() {
  const supabase = createClient();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("organization_id", ORG_ID)
      .order("created_at", { ascending: false });

    if (data) setTenants(data);
    setLoading(false);
  }

  const groupedTenants = useMemo(() => {
    const groups = {
      standard: [] as Tenant[],
      commissary: [] as Tenant[],
      inactive: [] as Tenant[],
    };

    tenants
      .filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((t) => {
        if (statusFilter === "active") return t.is_active;
        if (statusFilter === "inactive") return !t.is_active;
        return true;
      })
      .forEach((tenant) => {
        if (!tenant.is_active) {
          groups.inactive.push(tenant);
        } else if (tenant.billing_type === "commissary") {
          groups.commissary.push(tenant);
        } else {
          groups.standard.push(tenant);
        }
      });

    return groups;
  }, [tenants, search, statusFilter]);

  if (loading) {
    return (
      <div className="p-8 text-[var(--text)]">
        Loading tenants...
      </div>
    );
  }

  return (
<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* HEADER */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text)]">
              Tenants
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Manage kitchen clients and billing
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)] transition"
          >
            + Add Tenant
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* SECTIONS */}
      <Section
        title="Standard Billing"
        description="Kitchen time + cleaning fee"
        tenants={groupedTenants.standard}
      />

      <Section
        title="Commissary Address Fee"
        description="Includes monthly commissary address charge"
        tenants={groupedTenants.commissary}
      />

      <Section
        title="Inactive"
        description="Tenants currently not active"
        tenants={groupedTenants.inactive}
      />

      <TenantCreatePanel
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchTenants}
      />
    </div>
  );
}

function Section({
  title,
  description,
  tenants,
}: {
  title: string;
  description: string;
  tenants: Tenant[];
}) {
  if (!tenants.length) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </div>
    </div>
  );
}