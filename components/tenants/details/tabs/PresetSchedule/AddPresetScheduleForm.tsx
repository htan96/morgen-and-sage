"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  tenantId: string;
  onAdded: () => void;
};

type Kitchen = {
  id: string;
  name: string;
};

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AddPresetScheduleForm({
  tenantId,
  onAdded,
}: Props) {
  const supabase = createClient();

  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [weekday, setWeekday] = useState(1);
  const [kitchenId, setKitchenId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    fetchKitchens();
  }, []);

  async function fetchKitchens() {
    const { data } = await supabase
      .from("kitchen_spaces")
      .select("id, name")
      .order("name");

    setKitchens(data || []);
  }

  async function addSchedule() {
    if (!kitchenId || !startTime || !endTime) return;

    const { error } = await supabase.from("preset_schedules").insert({
      tenant_id: tenantId,
      weekday,
      kitchen_space_id: kitchenId,
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    });

    if (error) {
      console.error("Insert error:", error);
      return;
    }

    setStartTime("");
    setEndTime("");
    setKitchenId("");
    onAdded();
  }

  return (
    <div className="ui-card px-6 py-6 space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Add Recurring Schedule
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Configure weekly recurring kitchen time.
        </p>
      </div>

      {/* Grid Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Day */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Day
          </label>
          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            className="ui-input w-full"
          >
            {weekdays.map((day, index) => (
              <option key={index} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* Kitchen */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Kitchen
          </label>
          <select
            value={kitchenId}
            onChange={(e) => setKitchenId(e.target.value)}
            className="ui-input w-full"
          >
            <option value="">Select Kitchen</option>
            {kitchens.map((kitchen) => (
              <option key={kitchen.id} value={kitchen.id}>
                {kitchen.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Start */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="ui-input w-full"
          />
        </div>

        {/* End */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="ui-input w-full"
          />
        </div>
      </div>

      {/* Footer Action */}
      <div className="border-t border-[var(--border)] pt-4 flex justify-end">
        <button
          onClick={addSchedule}
          className="ui-btn-filled-save"
        >
          Save Schedule
        </button>
      </div>

    </div>
  );
}