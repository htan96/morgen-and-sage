"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PresetScheduleTable from "./PresetScheduleTable";
import AddPresetScheduleForm from "./AddPresetScheduleForm";
import { PresetScheduleItem } from "./types";

type Props = {
  tenantId: string;
};

export default function PresetScheduleTab({ tenantId }: Props) {
  const supabase = createClient();

  const [schedule, setSchedule] = useState<PresetScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [tenantId]);

  async function fetchSchedule() {
    setLoading(true);

    const { data, error } = await supabase
      .from("preset_schedules")
      .select("*, kitchen_spaces(name)")
      .eq("tenant_id", tenantId)
      .order("weekday", { ascending: true });

    if (error) {
      console.error(error);
      setSchedule([]);
    } else {
      setSchedule(data || []);
    }

    setLoading(false);
  }

  async function updateSchedule(id: string, start: string, end: string) {
    const { error } = await supabase
      .from("preset_schedules")
      .update({
        start_time: start,
        end_time: end,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    await fetchSchedule();
  }

  async function deleteSchedule(id: string) {
    const { error } = await supabase
      .from("preset_schedules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    await fetchSchedule();
  }

  if (loading) return <div>Loading schedule...</div>;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Weekly Recurring Schedule
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Configure weekly recurring kitchen time.
        </p>
      </div>

      {/* TABLE */}
      <PresetScheduleTable
        schedule={schedule}
        onUpdate={updateSchedule}
        onDelete={deleteSchedule}
      />

      {/* ADD FORM */}
      <AddPresetScheduleForm
        tenantId={tenantId}
        onAdded={fetchSchedule}
      />

    </div>
  );
}