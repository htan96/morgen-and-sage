"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  tenantId: string;
};

type Service = {
  id: string;
  name: string;
  default_amount: number;
  default_frequency: string;
};

type TenantService = {
  id: string;
  service_id: string;
  amount: number;
  quantity: number;
  frequency: string;
  is_active: boolean;
  due_date: string | null;
  services: {
    name: string;
  } | null;
};

export default function RatesTab({ tenantId }: Props) {
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [tenantServices, setTenantServices] = useState<TenantService[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [frequency, setFrequency] = useState<string>("per_booking");
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    fetchData();
  }, []);

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

  function handleServiceSelect(id: string) {
    const service = services.find((s) => s.id === id);
    if (!service) return;

    setSelectedServiceId(service.id);
    setAmount(service.default_amount);
    setFrequency(service.default_frequency);
  }

  async function handleAddService() {
    if (!selectedServiceId) return;

    await supabase.from("tenant_services").insert({
      tenant_id: tenantId,
      service_id: selectedServiceId,
      amount,
      frequency,
      quantity,
      is_active: true,
    });

    setShowAdd(false);
    setSelectedServiceId("");
    setAmount(0);
    setQuantity(1);

    fetchData();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase
      .from("tenant_services")
      .update({ is_active: !current })
      .eq("id", id);

    fetchData();
  }

  async function deleteService(id: string) {
    await supabase.from("tenant_services").delete().eq("id", id);
    fetchData();
  }

  if (loading) {
    return <div className="text-[var(--text-muted)]">Loading rates...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Billing Configuration
        </h2>

        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] text-sm"
        >
          + Add Service
        </button>
      </div>

      {/* Existing Services */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--hover)] text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Frequency</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {tenantServices.map((item) => (
              <tr key={item.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">
                  {item.services?.name || "Unknown"}
                </td>
                <td className="px-4 py-3">${item.amount}</td>
                <td className="px-4 py-3 capitalize">
                  {item.frequency.replace("_", " ")}
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(item.id, item.is_active)}
                    className="text-xs underline"
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteService(item.id)}
                    className="text-xs text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-[var(--text)]">
            Add Service
          </h3>

          <select
            onChange={(e) => handleServiceSelect(e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          >
            <option value="">Select Service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          />

          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          >
            <option value="per_booking">Per Booking</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="one_time">One Time</option>
          </select>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          />

          <div className="flex gap-3">
            <button
              onClick={handleAddService}
              className="px-4 py-2 rounded-lg bg-[var(--hover)]"
            >
              Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg border border-[var(--border)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}