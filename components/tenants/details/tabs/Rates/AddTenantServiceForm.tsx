"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "./types";

type Props = {
  tenantId: string;
  services: Service[];
  onAdded: () => void;
};

export default function AddTenantServiceForm({
  tenantId,
  services,
  onAdded,
}: Props) {
  const supabase = createClient();

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [frequency, setFrequency] = useState("per_booking");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  function handleServiceSelect(id: string) {
    const service = services.find((s) => s.id === id);
    if (!service) return;

    setSelectedServiceId(service.id);
    setAmount(service.default_amount);
    setFrequency(service.default_frequency);
  }

  async function handleAdd() {
    if (!selectedServiceId) return;

    setSaving(true);

    const { error } = await supabase.from("tenant_services").insert({
      tenant_id: tenantId,
      service_id: selectedServiceId,
      amount,
      frequency,
      quantity,
      is_active: true,
    });

    setSaving(false);

    if (error) {
      console.error("Insert error:", error);
      return;
    }

    // Reset form
    setSelectedServiceId("");
    setAmount(0);
    setFrequency("per_booking");
    setQuantity(1);

    await onAdded();
  }

  return (
    <div className="ui-card px-6 py-6 space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Add Billing Service
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Assign a billing service to this tenant.
        </p>
      </div>

      {/* Grid Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Service */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Service
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => handleServiceSelect(e.target.value)}
            className="ui-input w-full"
          >
            <option value="">Select Service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="ui-input w-full"
          />
        </div>
      </div>

      {/* Grid Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Frequency */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="ui-input w-full"
          >
            <option value="per_booking">Per Booking</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="one_time">One Time</option>
          </select>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="ui-input w-full"
          />
        </div>
      </div>

      {/* Footer Action */}
      <div className="border-t border-[var(--border)] pt-4 flex justify-end">
        <button
          onClick={handleAdd}
          disabled={saving}
          className="ui-btn-filled-save"
        >
          {saving ? "Saving..." : "Save Service"}
        </button>
      </div>

    </div>
  );
}