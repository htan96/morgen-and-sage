"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TenantServicesTable from "./TenantServicesTable";
import AddTenantServiceForm from "./AddTenantServiceForm";
import { Service, TenantService } from "./types";

type Props = {
  tenantId: string;
};

export default function RatesTab({ tenantId }: Props) {
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [tenantServices, setTenantServices] = useState<TenantService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) fetchData();
  }, [tenantId]);

  async function fetchData() {
    setLoading(true);

    /* -----------------------------
       1️⃣ Fetch ALL services (dropdown)
    ----------------------------- */
    const { data: serviceList, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (serviceError) {
      console.error("Services fetch error:", serviceError);
    }

    /* -----------------------------
       2️⃣ Fetch tenant services with EXPLICIT FK JOIN
    ----------------------------- */
    const { data: tenantServiceList, error: tenantError } = await supabase
      .from("tenant_services")
      .select(`
        id,
        amount,
        frequency,
        quantity,
        is_active,
        service_id,
        services:services!tenant_services_service_id_fkey (
          id,
          name
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

console.log("TENANT SERVICES RAW:", JSON.stringify(tenantServiceList, null, 2));
    if (tenantError) {
      console.error("Tenant services fetch error:", tenantError);
    }

    /* -----------------------------
       3️⃣ Format safely
    ----------------------------- */
    const formatted: TenantService[] = (tenantServiceList || []).map(
      (item: any) => ({
        id: item.id,
        amount: item.amount,
        frequency: item.frequency,
        quantity: item.quantity,
        is_active: item.is_active,
        service_id: item.service_id,
        services: item.services ?? null,
      })
    );

    setServices(serviceList || []);
    setTenantServices(formatted);
    setLoading(false);
  }

  /* -----------------------------
     UPDATE
  ----------------------------- */
  async function updateService(
    id: string,
    amount: number,
    frequency: string,
    quantity: number
  ) {
    const { error } = await supabase
      .from("tenant_services")
      .update({ amount, frequency, quantity })
      .eq("id", id);

    if (!error) fetchData();
  }

  /* -----------------------------
     TOGGLE STATUS
  ----------------------------- */
  async function toggleStatus(id: string, current: boolean) {
    const { error } = await supabase
      .from("tenant_services")
      .update({ is_active: !current })
      .eq("id", id);

    if (!error) fetchData();
  }

  /* -----------------------------
     DELETE
  ----------------------------- */
  async function deleteService(id: string) {
    const { error } = await supabase
      .from("tenant_services")
      .delete()
      .eq("id", id);

    if (!error) fetchData();
  }

  if (loading) {
    return (
      <div className="py-6 text-sm text-[var(--text-muted)]">
        Loading services...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Billing Configuration
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Configure recurring or one-time billing services.
        </p>
      </div>

      {/* SERVICES TABLE */}
      <TenantServicesTable
        tenantServices={tenantServices}
        onUpdate={updateService}
        onDelete={deleteService}
        onToggleStatus={toggleStatus}
      />

      {/* ADD BILLING SERVICE FORM */}
      <AddTenantServiceForm
        tenantId={tenantId}
        services={services}
        onAdded={fetchData}
      />

    </div>
  );
}