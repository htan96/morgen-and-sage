"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/app/actions/createBooking";
import { Booking } from "@/types/booking";

import BookingPanelHeader from "./BookingPanelHeader";
import BookingSelectors from "./BookingSelectors";
import DraftBookingList from "./DraftBookingList";
import InvoicePreviewCard from "./InvoicePreviewCard";
import BookingPanelFooter from "./BookingPanelFooter";

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
  portalMode?: boolean;
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
  portalMode = false,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [step, setStep] = useState<"build" | "confirm">("build");

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [panelKitchenId, setPanelKitchenId] = useState<string | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<any | null>(null);

  const organizationId = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";
  const isEditMode = !!editingBooking;

  /* ---------------- Portal Tenant Auto Assign ---------------- */

  useEffect(() => {
    if (portalMode && tenants.length > 0) {
      setTenantId(tenants[0].id);
    }
  }, [portalMode, tenants]);

  /* ---------------- Reset when panel closes ---------------- */

  useEffect(() => {
    if (!isOpen) {
      setStep("build");
      setInvoicePreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /* =============================
     REVIEW HANDLER (Fetch Preview)
     ============================= */

  const handleReview = async () => {
    if (!tenantId || !panelKitchenId || draftBookings.length === 0) return;

    try {
      setPreviewLoading(true);
      setInvoicePreview(null);

      const res = await fetch("/api/bookings/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          tenantId,
          kitchenSpaceId: panelKitchenId,
          bookings: draftBookings.map((d) => ({
            startTime: new Date(d.startTime).toISOString(),
            endTime: new Date(d.endTime).toISOString(),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Preview failed");
        return;
      }

      setInvoicePreview(data);
      setStep("confirm");
    } catch (err) {
      console.error("Preview error:", err);
      alert("Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  /* =============================
     SUBMIT HANDLER
     ============================= */

  const handleSubmit = async () => {
    if (loading || previewLoading) return;

    setLoading(true);

    try {
      for (const draft of draftBookings) {
        const result = await createBooking({
          organizationId,
          tenantId: tenantId!,
          kitchenSpaceId: panelKitchenId!,
          startTime: new Date(draft.startTime).toISOString(),
          endTime: new Date(draft.endTime).toISOString(),
        });

        if (!result?.booking) {
          alert(result?.error || "Booking failed");
          return;
        }
      }

      clearDrafts();
      setStep("build");
      setInvoicePreview(null);
      onClose();
      router.refresh();
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* =============================
     REVIEW GATE
     ============================= */

  const canReview =
    !!tenantId &&
    !!panelKitchenId &&
    draftBookings.length > 0 &&
    !previewLoading;

  /* =============================
     RENDER
     ============================= */

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={!loading ? onClose : undefined}
      />

      <div
        className="fixed right-0 top-0 h-full w-[450px] z-50 flex flex-col shadow-xl"
        style={{
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <BookingPanelHeader
          isEditMode={isEditMode}
          title={
            step === "build"
              ? "Create Booking"
              : "Confirm Booking Submission"
          }
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === "build" && (
            <>
              <BookingSelectors
                tenantId={tenantId}
                setTenantId={setTenantId}
                panelKitchenId={panelKitchenId}
                setPanelKitchenId={setPanelKitchenId}
                tenants={portalMode ? [] : tenants}
                kitchens={kitchens}
              />

              <DraftBookingList
                draftBookings={draftBookings}
                updateDraft={updateDraft}
                removeDraft={removeDraft}
                addNextDayDraft={addNextDayDraft}
              />
            </>
          )}

          {step === "confirm" && invoicePreview && (
            <>
              <InvoicePreviewCard invoicePreview={invoicePreview} />

              <div className="text-sm opacity-80">
                This submission will create{" "}
                <strong>{invoicePreview.bookingCount}</strong> bookings and
                generate <strong>1 invoice</strong>.
              </div>
            </>
          )}
        </div>

        <BookingPanelFooter
          loading={loading}
          isEditMode={false}
          onSubmit={
            step === "build"
              ? handleReview
              : handleSubmit
          }
          disabled={
            step === "build"
              ? !canReview
              : loading || previewLoading
          }
          label={
            step === "build"
              ? "Review & Confirm"
              : "Confirm & Submit"
          }
          secondaryAction={
            step === "confirm"
              ? () => setStep("build")
              : undefined
          }
        />
      </div>
    </>
  );
}