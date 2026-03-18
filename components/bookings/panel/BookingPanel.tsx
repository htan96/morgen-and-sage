"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingSession } from "@/app/actions/billing/createBookingSession";
import { validateDraftBookings } from "@/lib/bookings/validateDraftBookings";
import { formatDateTimePacific } from "@/lib/datetime";
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
  organizationId: string;
  tenantIdFromPortal?: string;
  portalMode?: boolean;
  panelKitchenId: string | null;
  setPanelKitchenId: (id: string | null) => void;
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
  organizationId,
  tenantIdFromPortal,
  portalMode = false,
  panelKitchenId,
  setPanelKitchenId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [step, setStep] = useState<"build" | "confirm">("build");

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<any | null>(null);

  const isViewMode = !!editingBooking;

  const effectiveTenantId = tenantId ?? tenantIdFromPortal;

  /* ---------------- Portal Tenant Auto Assign ---------------- */

  useEffect(() => {
    if (portalMode && tenantIdFromPortal) {
      setTenantId(tenantIdFromPortal);
    }
  }, [portalMode, tenantIdFromPortal]);

  /* ---------------- Reset when panel closes ---------------- */

  useEffect(() => {
    if (!isOpen) {
      setStep("build");
      setInvoicePreview(null);
      setTenantId(null);
      setPanelKitchenId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /* =============================
     REVIEW HANDLER
  ============================= */

  const handleReview = async () => {
    if (!effectiveTenantId || !panelKitchenId || draftBookings.length === 0)
      return;

    const validation = validateDraftBookings(draftBookings);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setPreviewLoading(true);
      setInvoicePreview(null);

      const res = await fetch("/api/bookings/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          tenantId: effectiveTenantId,
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
    if (!effectiveTenantId || !panelKitchenId) return;

    const validation = validateDraftBookings(draftBookings);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setLoading(true);

    try {

      const result = await createBookingSession({
        organizationId,
        tenantId: effectiveTenantId,
        kitchenSpaceId: panelKitchenId,
        bookings: draftBookings.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      });

      if (!result?.invoiceId) {
        alert("Failed to generate invoice.");
        return;
      }

      clearDrafts();
      setStep("build");
      setInvoicePreview(null);
      onClose();

      router.refresh();

    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert(message);
    } finally {

      setLoading(false);

    }
  };

  /* =============================
     REVIEW GATE
  ============================= */

  const canReview =
    !!effectiveTenantId &&
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
          isEditMode={isViewMode}
          title={
            isViewMode
              ? "Booking Details"
              : step === "build"
              ? "Create Booking"
              : "Confirm Booking Submission"
          }
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {isViewMode && editingBooking && (
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wide opacity-70">Tenant</span>
                <p className="text-sm font-medium mt-1">
                  {editingBooking.tenant?.name ?? "Unknown"}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide opacity-70">Kitchen</span>
                <p className="text-sm font-medium mt-1">
                  {editingBooking.kitchen?.name ?? "Unknown"}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide opacity-70">Start</span>
                <p className="text-sm font-medium mt-1">
                  {formatDateTimePacific(editingBooking.start_time)}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide opacity-70">End</span>
                <p className="text-sm font-medium mt-1">
                  {formatDateTimePacific(editingBooking.end_time)}
                </p>
              </div>
            </div>
          )}

          {!isViewMode && step === "build" && (
            <>
              <BookingSelectors
                tenantId={tenantId}
                setTenantId={setTenantId}
                panelKitchenId={panelKitchenId}
                setPanelKitchenId={setPanelKitchenId}
                tenants={portalMode ? [] : tenants}
                kitchens={kitchens}
                portalMode={portalMode}
              />

              <DraftBookingList
                draftBookings={draftBookings}
                updateDraft={updateDraft}
                removeDraft={removeDraft}
                addNextDayDraft={addNextDayDraft}
              />
            </>
          )}

          {!isViewMode && step === "confirm" && invoicePreview && (
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

        {isViewMode && (
          <div
            className="p-6 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg font-medium"
              style={{
                background: "var(--hover)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Close
            </button>
          </div>
        )}

        {!isViewMode && (
          <BookingPanelFooter
            loading={loading}
            isEditMode={false}
            onSubmit={step === "build" ? handleReview : handleSubmit}
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
        )}
      </div>
    </>
  );
}