"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/app/actions/createBooking";
import { createClient } from "@/lib/supabase/client";
import { Booking } from "@/types/booking";

type DraftBooking = {
  id: string;
  startTime: string;
  endTime: string;
};

type Tenant = {
  id: string;
  name: string;
};

type Kitchen = {
  id: string;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  draftBookings: DraftBooking[];
  removeDraft: (id: string) => void;
  updateDraft: (id: string, updates: Partial<DraftBooking>) => void;
  editingBooking: Booking | null;
  tenants: Tenant[];
  kitchens: Kitchen[];
  clearDrafts: () => void;
  addNextDayDraft: () => void;
};

export default function BookingPanel({
  isOpen,
  onClose,
  draftBookings,
  removeDraft,
  updateDraft,
  editingBooking,
  tenants,
  kitchens,
  clearDrafts,
  addNextDayDraft,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [panelKitchenId, setPanelKitchenId] = useState<string | null>(null);

  // ✅ NEW: invoice preview state
  const [invoicePreview, setInvoicePreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const organizationId = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

  if (!isOpen) return null;

  const isEditMode = !!editingBooking;

  // ✅ NEW: Fetch preview when tenant or draft bookings change
  useEffect(() => {
    if (!tenantId || draftBookings.length === 0 || isEditMode) {
      setInvoicePreview(null);
      return;
    }

    const fetchPreview = async () => {
      setPreviewLoading(true);

      const res = await fetch("/api/bookings/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          tenantId,
          bookings: draftBookings.map((d) => ({
            startTime: new Date(d.startTime).toISOString(),
            endTime: new Date(d.endTime).toISOString(),
          })),
        }),
      });

      const data = await res.json();
      setInvoicePreview(data);
      setPreviewLoading(false);
    };

    fetchPreview();
  }, [tenantId, draftBookings, isEditMode]);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (isEditMode && editingBooking) {
        await supabase
          .from("bookings")
          .update({
            start_time: editingBooking.start_time,
            end_time: editingBooking.end_time,
          })
          .eq("id", editingBooking.id);

        onClose();
        router.refresh();
        return;
      }

      if (!tenantId || !panelKitchenId) {
        alert("Select tenant and kitchen");
        return;
      }

      for (const draft of draftBookings) {
        await createBooking({
          organizationId,
          tenantId,
          kitchenSpaceId: panelKitchenId,
          startTime: new Date(draft.startTime).toISOString(),
          endTime: new Date(draft.endTime).toISOString(),
          notes: "",
        });
      }

      clearDrafts();
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      <div
        className="fixed right-0 top-0 h-full w-[450px] z-50 flex flex-col shadow-xl"
        style={{
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div
          className="p-6 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-semibold">
            {isEditMode ? "Edit Booking" : "Create Booking"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isEditMode && (
            <>
              <div>
                <label className="block text-sm mb-2">Kitchen</label>
                <select
                  value={panelKitchenId ?? ""}
                  onChange={(e) => setPanelKitchenId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="">Select kitchen</option>
                  {kitchens.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Tenant</label>
                <select
                  value={tenantId ?? ""}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!isEditMode &&
            draftBookings.map((draft) => (
              <div
                key={draft.id}
                className="p-4 rounded-lg space-y-3"
                style={{
                  border: "1px solid var(--border)",
                }}
              >
                <input
                  type="datetime-local"
                  value={draft.startTime}
                  onChange={(e) =>
                    updateDraft(draft.id, {
                      startTime: e.target.value,
                    })
                  }
                  className="w-full rounded-lg px-3 py-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />

                <input
                  type="datetime-local"
                  value={draft.endTime}
                  onChange={(e) =>
                    updateDraft(draft.id, {
                      endTime: e.target.value,
                    })
                  }
                  className="w-full rounded-lg px-3 py-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />

                <button
                  onClick={() => removeDraft(draft.id)}
                  className="text-sm"
                  style={{ color: "#ef4444" }}
                >
                  Remove
                </button>
              </div>
            ))}

          {!isEditMode && draftBookings.length > 0 && (
            <button
              onClick={addNextDayDraft}
              className="w-full py-2 rounded-lg text-sm"
              style={{
                border: "1px dashed var(--border)",
              }}
            >
              + Add Next Day (9AM–1PM)
            </button>
          )}

          {/* ✅ NEW: Invoice Preview Block */}
          {invoicePreview && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{ border: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-semibold">
                Invoice Preview
              </h3>

              <div className="text-sm">
                {invoicePreview.bookingCount} dates selected
              </div>

              <div className="text-sm">
                {invoicePreview.earliestDate} –{" "}
                {invoicePreview.latestDate}
              </div>

              <div className="border-t pt-2 text-sm">
                {invoicePreview.totalHours} hrs @ $
                {invoicePreview.hourlyRate}/hr
              </div>

              <div className="text-sm">
                Usage: ${invoicePreview.usageSubtotal}
              </div>

              {invoicePreview.monthlyFee !== null && (
                <div className="text-sm">
                  Monthly Fee ({invoicePreview.monthLabel}): $
                  {invoicePreview.monthlyFee}
                </div>
              )}

              {invoicePreview.monthlyAlreadyBilled && (
                <div className="text-xs opacity-60">
                  Monthly fee already billed
                </div>
              )}

              <div className="border-t pt-2 font-medium text-sm">
                Total: ${invoicePreview.total}
              </div>

              <div className="text-xs opacity-70">
                Due: {invoicePreview.dueDateLabel}
              </div>
            </div>
          )}
        </div>

        <div
          className="p-6 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={handleSubmit}
            disabled={loading || previewLoading}
            className="w-full py-3 rounded-lg font-medium"
            style={{
              background: "var(--text)",
              color: "var(--bg)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Booking"
              : "Submit Bookings"}
          </button>
        </div>
      </div>
    </>
  );
}