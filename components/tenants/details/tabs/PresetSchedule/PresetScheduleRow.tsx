"use client";

import { useState } from "react";
import RowActions from "@/components/ui/RowActions";
import { PresetScheduleItem } from "./types";

type Props = {
  item: PresetScheduleItem;
  dayLabel: string;
  onUpdate: (id: string, start: string, end: string) => void;
  onDelete: (id: string) => void;
};

export default function PresetScheduleRow({
  item,
  dayLabel,
  onUpdate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(item.start_time);
  const [end, setEnd] = useState(item.end_time);

  function formatTime(time: string) {
    if (!time) return "";

    const [hourStr, minuteStr] = time.split(":");
    const hour = Number(hourStr);

    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minuteStr} ${suffix}`;
  }

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--hover)] transition-colors">

      {/* Day */}
      <td className="px-6 py-4 text-[var(--text)]">
        {dayLabel}
      </td>

      {/* Kitchen */}
      <td className="px-6 py-4 text-[var(--text)]">
        {item.kitchen_spaces?.name || "—"}
      </td>

      {/* Start Time */}
      <td className="px-6 py-4">
        {editing ? (
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="ui-input text-sm"
          />
        ) : (
          <span className="text-[var(--text)] font-medium">
            {formatTime(start)}
          </span>
        )}
      </td>

      {/* End Time */}
      <td className="px-6 py-4">
        {editing ? (
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="ui-input text-sm"
          />
        ) : (
          <span className="text-[var(--text)] font-medium">
            {formatTime(end)}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <RowActions
          editing={editing}
          onEdit={() => setEditing(true)}
          onSave={() => {
            onUpdate(item.id, start, end);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          onDelete={() => onDelete(item.id)}
        />
      </td>

    </tr>
  );
}