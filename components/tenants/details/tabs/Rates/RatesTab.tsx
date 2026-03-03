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
  const [tenantServices, setTenantServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    fetchData();
  }, [tenantId]);

  async function fetchData() {
    setLoading(true);

    // 1️⃣ Get all services
    const { data: serviceList, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (serviceError) {
      console.error("Services fetch error:", serviceError);
    }

    // 2️⃣ Get tenant services (NO JOIN)
    const { data: tenantServiceList, error: tenantError } = await supabase
      .from("tenant_services")
      .select("*")
      .eq("tenant_id", tenantId);

    if (tenantError) {
      console.error("Tenant services fetch error:", tenantError);
    }

    // 3️⃣ Build service lookup map
    const serviceMap: Record<string, Service> = {};
    (serviceList || []).forEach((s) => {
      serviceMap[s.id] = s;
    });

    // 4️⃣ Attach service info manually
    const enrichedTenantServices = (tenantServiceList || []).map((ts) => ({
      ...ts,
      services: serviceMap[ts.service_id]
        ? [{ id: serviceMap[ts.service_id].id, name: serviceMap[ts.service_id].name }]
        : null,
    }));

    setServices(serviceList || []);
    setTenantServices(enrichedTenantServices);
    setLoading(false);
  }

  async function updateService(
    id: string,
    amount: number,
    frequency: string,
    quantity: number
  ) {
    await supabase
      .from("tenant_services")
      .update({ amount, frequency, quantity })
      .eq("id", id);

    fetchData();
  }

  async function toggleStatus(id: string, current: boolean) {
    await supabase
      .from("tenant_services")
      .update({ is_active: !current })
      .eq("id", id);

    fetchData();
  }

  async function deleteService(id: string) {
    await supabase
      .from("tenant_services")
      .delete()
      .eq("id", id);

    fetchData();
  }

  if (loading) {
    return <div className="py-6">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Billing Configuration
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Configure recurring or one-time billing services.
        </p>
      </div>

      <TenantServicesTable
        tenantServices={tenantServices}
        onUpdate={updateService}
        onDelete={deleteService}
        onToggleStatus={toggleStatus}
      />

      <AddTenantServiceForm
        tenantId={tenantId}
        services={services}
        onAdded={fetchData}
      />
    </div>
  );
}