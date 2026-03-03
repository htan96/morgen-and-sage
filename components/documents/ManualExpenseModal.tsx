"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Organization = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  organizations: Organization[];
  onCreated: () => void;
};

export default function ManualExpenseModal({
  open,
  onClose,
  organizations,
  onCreated,
}: Props) {
  const supabase = createClient();

  const [organizationId, setOrganizationId] = useState("");
  const [addingOrg, setAddingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleCreateOrganization() {
    if (!newOrgName.trim()) return;

    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: newOrgName.trim() })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setOrganizationId(data.id);
    setAddingOrg(false);
    setNewOrgName("");
    onCreated(); // refresh org list in parent
  }

  async function handleSubmit() {
    if (!organizationId || !vendor || !amount || !date) {
      alert("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("documents").insert({
      organization_id: organizationId,
      vendor_name: vendor.trim(),
      document_date: date,
      total_amount: Number(amount),
      category: category || null,
      notes: notes || null,
      doc_type: "manual",
      status: "complete",
      file_path: null,
    });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    // Reset form
    setOrganizationId("");
    setVendor("");
    setAmount("");
    setDate("");
    setCategory("");
    setNotes("");

    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="w-full max-w-lg rounded-xl p-6"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="text-lg font-semibold mb-6">
          Add Manual Expense
        </h2>

        {/* Organization */}
        <div className="mb-5">
          <label className="text-sm font-medium">
            Organization *
          </label>

          {!addingOrg ? (
            <>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
              >
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setAddingOrg(true)}
                className="text-xs mt-2 underline"
              >
                + Add new organization
              </button>
            </>
          ) : (
            <div className="flex gap-2 mt-2">
              <input
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Organization name"
                className="flex-1 p-2.5 rounded-md border bg-transparent"
              />
              <button
                onClick={handleCreateOrganization}
                className="px-3 rounded-md border"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Vendor */}
        <div className="mb-5">
          <label className="text-sm font-medium">
            Vendor *
          </label>
          <input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="PG&E, Verizon..."
            className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
          />
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-sm font-medium">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Expense Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
            />
          </div>
        </div>

        {/* Category */}
        <div className="mb-5">
          <label className="text-sm font-medium">
            Category
          </label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Utilities, Internet..."
            className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="text-sm font-medium">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-md"
            style={{
              background: "var(--text)",
              color: "var(--bg)",
            }}
          >
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}