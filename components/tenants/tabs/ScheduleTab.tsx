"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  tenantId: string;
};

type Kitchen = {
  id: string;
  name: string;
};

type ScheduleItem = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  kitchen_spaces: {
    name: string;
  } | null;
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

export default function ScheduleTab({ tenantId }: Props) {
  const supabase = createClient();

  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [weekday, setWeekday] = useState(1);
  const [kitchenId, setKitchenId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: kitchenList } = await supabase
      .from("kitchen_spaces")
      .select("id, name")
      .order("name");

    const { data: scheduleList } = await supabase
      .from("tenant_recurring_schedule")
      .select("*, kitchen_spaces(name)")
      .eq("tenant_id", tenantId)
      .order("weekday");

    setKitchens(kitchenList || []);
    setSchedule(scheduleList || []);
    setLoading(false);
  }

  async function addSchedule() {
    if (!kitchenId || !startTime || !endTime) return;

    await supabase.from("tenant_recurring_schedule").insert({
      tenant_id: tenantId,
      weekday,
      kitchen_space_id: kitchenId,
      start_time: startTime,
      end_time: endTime,
    });

    setShowAdd(false);
    setStartTime("");
    setEndTime("");
    fetchData();
  }

  async function deleteSchedule(id: string) {
    await supabase
      .from("tenant_recurring_schedule")
      .delete()
      .eq("id", id);

    fetchData();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Weekly Recurring Schedule
        </h2>

        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] transition text-sm"
        >
          + Add Recurring Day
        </button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--hover)] text-[var(--text-muted)]">
            <tr>
              <th className="text-left px-4 py-3">Day</th>
              <th className="text-left px-4 py-3">Kitchen</th>
              <th className="text-left px-4 py-3">Start</th>
              <th className="text-left px-4 py-3">End</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {schedule.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-[var(--text-muted)]"
                >
                  No recurring schedule configured.
                </td>
              </tr>
            )}

            {schedule.map((item) => (
              <tr
                key={item.id}
                className="border-t border-[var(--border)]"
              >
                <td className="px-4 py-3">
                  {weekdays[item.weekday]}
                </td>
                <td className="px-4 py-3">
                  {item.kitchen_spaces?.name || "—"}
                </td>
                <td className="px-4 py-3">{item.start_time}</td>
                <td className="px-4 py-3">{item.end_time}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteSchedule(item.id)}
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

      {showAdd && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Add Recurring Day</h3>

          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          >
            {weekdays.map((day, index) => (
              <option key={index} value={index}>
                {day}
              </option>
            ))}
          </select>

          <select
            value={kitchenId}
            onChange={(e) => setKitchenId(e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          >
            <option value="">Select Kitchen</option>
            {kitchens.map((kitchen) => (
              <option key={kitchen.id} value={kitchen.id}>
                {kitchen.name}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          />

          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface)]"
          />

          <div className="flex gap-3">
            <button
              onClick={addSchedule}
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