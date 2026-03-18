"use client";

import { useEffect, useState } from "react";
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
  const [addingVendor, setAddingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [notes, setNotes] = useState("");

  const [applyToMultipleMonths, setApplyToMultipleMonths] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  useEffect(() => {
    if (!open) return;

    async function fetchOptions() {
      const { data } = await supabase
        .from("documents")
        .select("vendor_name, category")
        .not("vendor_name", "is", null)
        .not("vendor_name", "eq", "");

      if (data) {
        const vendorSet = new Set<string>();
        const categorySet = new Set<string>();
        data.forEach((d: any) => {
          if (d.vendor_name) vendorSet.add(d.vendor_name.trim());
          if (d.category) categorySet.add(d.category.trim());
        });
        setVendors(Array.from(vendorSet).sort());
        setCategories(Array.from(categorySet).sort());
      }
    }

    fetchOptions();
  }, [open]);

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

  function getLastDayOfMonth(y: number, monthIndex: number): number {
    return new Date(y, monthIndex + 1, 0).getDate();
  }

  function formatDocumentDate(y: number, monthIndex: number, day: number): string {
    const lastDay = getLastDayOfMonth(y, monthIndex);
    const d = Math.min(day, lastDay);
    return `${y}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  async function handleSubmit() {
    const effectiveVendor = addingVendor ? newVendorName.trim() : vendor;
    const effectiveCategory = addingCategory ? newCategoryName.trim() : category || null;

    const isValidSingle =
      organizationId && effectiveVendor && amount && date;
    const isValidMulti =
      applyToMultipleMonths &&
      organizationId &&
      effectiveVendor &&
      amount &&
      selectedMonths.length > 0;

    if (!isValidSingle && !isValidMulti) {
      alert("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    const dayToUse = dayOfMonth ? Math.min(31, Math.max(1, parseInt(dayOfMonth, 10) || 1)) : 1;
    const amountNum = Number(amount);

    if (applyToMultipleMonths) {
      const rows = selectedMonths.map((monthIndex) => ({
        organization_id: organizationId,
        vendor_name: effectiveVendor,
        document_date: formatDocumentDate(year, monthIndex, dayToUse),
        amount: amountNum,
        category: effectiveCategory || null,
        notes: notes || null,
        doc_type: "manual",
        status: "complete",
      }));

      const { error } = await supabase.from("documents").insert(rows);

      setSaving(false);

      if (error) {
        alert(error.message);
        return;
      }

      alert(`Created ${rows.length} expense entries.`);
    } else {
      const { error } = await supabase.from("documents").insert({
        organization_id: organizationId,
        vendor_name: effectiveVendor,
        document_date: date,
        amount: amountNum,
        category: effectiveCategory || null,
        notes: notes || null,
        doc_type: "manual",
        status: "complete",
      });

      setSaving(false);

      if (error) {
        alert(error.message);
        return;
      }
    }

    // Reset form
    setOrganizationId("");
    setVendor("");
    setAddingVendor(false);
    setNewVendorName("");
    setAmount("");
    setDate("");
    setCategory("");
    setAddingCategory(false);
    setNewCategoryName("");
    setNotes("");
    setApplyToMultipleMonths(false);
    setYear(new Date().getFullYear());
    setSelectedMonths([]);
    setDayOfMonth("");

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
          {!addingVendor ? (
            <>
              <select
                value={vendor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__new__") setAddingVendor(true);
                  else setVendor(v);
                }}
                className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                <option value="__new__">+ Add new vendor</option>
              </select>
            </>
          ) : (
            <div className="flex gap-2 mt-2">
              <input
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="Vendor name (e.g. PG&E, Verizon)"
                className="flex-1 p-2.5 rounded-md border bg-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (newVendorName.trim()) {
                    setVendor(newVendorName.trim());
                    if (!vendors.includes(newVendorName.trim())) {
                      setVendors((prev) => [...prev, newVendorName.trim()].sort());
                    }
                  }
                  setAddingVendor(false);
                  setNewVendorName("");
                }}
                className="px-3 rounded-md border"
              >
                Use
              </button>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-5">
          <label className="text-sm font-medium">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
          />
        </div>

        {/* Apply to multiple months */}
        <div className="mb-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToMultipleMonths}
              onChange={(e) => setApplyToMultipleMonths(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Apply to multiple months</span>
          </label>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Create this expense for each selected month (e.g. recurring rent, utilities)
          </p>
        </div>

        {applyToMultipleMonths ? (
          <div className="mb-5 space-y-4 p-4 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Year *</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Day of month (optional)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Defaults to 1st if empty
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Months *</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MONTH_NAMES.map((name, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md cursor-pointer"
                    style={{
                      background: selectedMonths.includes(i) ? "var(--hover)" : "transparent",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(i)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMonths((prev) => [...prev, i].sort((a, b) => a - b));
                        } else {
                          setSelectedMonths((prev) => prev.filter((m) => m !== i));
                        }
                      }}
                      className="rounded"
                    />
                    {name}
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelectedMonths(
                    selectedMonths.length === 12
                      ? []
                      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
                  )
                }
                className="text-xs mt-2 underline"
              >
                {selectedMonths.length === 12 ? "Clear all" : "Select all"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <label className="text-sm font-medium">Expense Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
            />
          </div>
        )}

        {/* Category */}
        <div className="mb-5">
          <label className="text-sm font-medium">
            Category
          </label>
          {!addingCategory ? (
            <>
              <select
                value={category}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__new__") setAddingCategory(true);
                  else setCategory(v);
                }}
                className="w-full mt-2 p-2.5 rounded-md border bg-transparent"
              >
                <option value="">Select category (optional)</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">+ Add new category</option>
              </select>
            </>
          ) : (
            <div className="flex gap-2 mt-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category (e.g. Utilities, Internet)"
                className="flex-1 p-2.5 rounded-md border bg-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (newCategoryName.trim()) {
                    setCategory(newCategoryName.trim());
                    if (!categories.includes(newCategoryName.trim())) {
                      setCategories((prev) => [...prev, newCategoryName.trim()].sort());
                    }
                  }
                  setAddingCategory(false);
                  setNewCategoryName("");
                }}
                className="px-3 rounded-md border"
              >
                Use
              </button>
            </div>
          )}
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