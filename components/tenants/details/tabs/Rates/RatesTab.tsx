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
    fetchData();
  }, [tenantId]);

  async function fetchData() {
    setLoading(true);

    const { data: serviceList, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .order("name");

    const { data: tenantServiceList, error: tenantError } = await supabase
      .from("tenant_services")
      .select("*, services(name)")
      .eq("tenant_id", tenantId);

    if (serviceError) console.error(serviceError);
    if (tenantError) console.error(tenantError);

    setServices(serviceList || []);
    setTenantServices(tenantServiceList || []);
    setLoading(false);
  }

  // 🔧 EDIT UPDATE
  async function updateService(
    id: string,
    amount: number,
    frequency: string,
    quantity: number
  ) {
    const { error } = await supabase
      .from("tenant_services")
      .update({
        amount,
        frequency,
        quantity,
      })
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      return;
    }

    await fetchData();
  }

  // 🔧 STATUS TOGGLE
  async function toggleStatus(id: string, current: boolean) {
    const { error } = await supabase
      .from("tenant_services")
      .update({
        is_active: !current,
      })
      .eq("id", id);

    if (error) {
      console.error("Toggle error:", error);
      return;
    }

    await fetchData();
  }

  // 🔧 DELETE
  async function deleteService(id: string) {
    const { error } = await supabase
      .from("tenant_services")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    await fetchData();
  }

  if (loading) return <div>Loading services...</div>;

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

      {/* TABLE */}
      <TenantServicesTable
        tenantServices={tenantServices}
        onUpdate={updateService}
        onDelete={deleteService}
        onToggleStatus={toggleStatus}
      />

      {/* ADD FORM ALWAYS VISIBLE */}
      <AddTenantServiceForm
        tenantId={tenantId}
        services={services}
        onAdded={fetchData}
      />

    </div>
  );
}