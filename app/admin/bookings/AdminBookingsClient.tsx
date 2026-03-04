"use client";

import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Booking } from "@/types/booking";
import MonthView from "@/components/bookings/calendar/MonthView";
import BookingsHeader from "@/components/bookings/calendar/BookingsHeader";
import BookingPanel from "@/components/bookings/panel/BookingPanel";

type Kitchen = {
  id: string;
  name: string;
};

type Tenant = {
  id: string;
  name: string;
};

type DraftBooking = {
  id: string;
  startTime: string; // local format YYYY-MM-DDTHH:MM
  endTime: string;
};

type Props = {
  bookings: Booking[];
  kitchens: Kitchen[];
  tenants: Tenant[];
};

const formatForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AdminBookingsClient({
  bookings,
  kitchens,
  tenants,
}: Props) {
  const [selectedKitchenId, setSelectedKitchenId] =
    useState<string | null>(null);

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [isPanelOpen, setIsPanelOpen] =
    useState(false);

  const [editingBooking, setEditingBooking] =
    useState<Booking | null>(null);

  const [draftBookings, setDraftBookings] =
    useState<DraftBooking[]>([]);

  const [panelKitchenId, setPanelKitchenId] =
    useState<string | null>(null);

  /* ---------------- Month Nav ---------------- */

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  /* ---------------- Filtering ---------------- */

  const filteredBookings = useMemo(() => {
    if (!selectedKitchenId) return bookings;
    return bookings.filter(
      (b) => b.kitchen_space_id === selectedKitchenId
    );
  }, [bookings, selectedKitchenId]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};

    for (const booking of filteredBookings) {
      const key = new Date(booking.start_time)
        .toISOString()
        .split("T")[0];

      if (!map[key]) map[key] = [];
      map[key].push(booking);
    }

    return map;
  }, [filteredBookings]);

  /* ---------------- Draft Helpers ---------------- */

  const createInitialDraft = (date: Date) => {
    const start = new Date(date);
    start.setHours(9, 0, 0);

    const end = new Date(start);
    end.setHours(13, 0, 0);

    const newDraft: DraftBooking = {
      id: uuidv4(),
      startTime: formatForInput(start),
      endTime: formatForInput(end),
    };

    setDraftBookings([newDraft]);
  };

  const addNextDayDraft = () => {
    if (draftBookings.length === 0) return;

    const lastDraft = draftBookings[draftBookings.length - 1];
    const lastStart = new Date(lastDraft.startTime);

    const newStart = new Date(lastStart);
    newStart.setDate(newStart.getDate() + 1);
    newStart.setHours(9, 0, 0);

    const newEnd = new Date(newStart);
    newEnd.setHours(13, 0, 0);

    const newDraft: DraftBooking = {
      id: uuidv4(),
      startTime: formatForInput(newStart),
      endTime: formatForInput(newEnd),
    };

    setDraftBookings((prev) => [...prev, newDraft]);
  };

  const removeDraft = (id: string) => {
    setDraftBookings((prev) =>
      prev.filter((d) => d.id !== id)
    );
  };

  const updateDraft = (
    id: string,
    updates: Partial<DraftBooking>
  ) => {
    setDraftBookings((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      )
    );
  };

  const clearDrafts = () => {
    setDraftBookings([]);
  };

  const handleDayClick = (date: Date) => {
    setEditingBooking(null);
    setPanelKitchenId(
      selectedKitchenId ?? kitchens[0]?.id ?? null
    );

    createInitialDraft(date);
    setIsPanelOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setDraftBookings([]);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingBooking(null);
    clearDrafts();
  };

  return (
    <>
      <div
        className="p-6 rounded-2xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <BookingsHeader
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          kitchens={kitchens}
          selectedKitchenId={selectedKitchenId}
          setSelectedKitchenId={setSelectedKitchenId}
        />

        <MonthView
          currentDate={currentDate}
          bookingsByDate={bookingsByDate}
          onDayClick={handleDayClick}
          onEditBooking={handleEditBooking}
        />
      </div>

      <BookingPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        editingBooking={editingBooking}
        draftBookings={draftBookings}
        removeDraft={removeDraft}
        updateDraft={updateDraft}
        clearDrafts={clearDrafts}
        addNextDayDraft={addNextDayDraft}
        kitchens={kitchens}
        tenants={tenants}
      />
    </>
  );
}