import DataTable from "@/components/ui/DataTable";
import PresetScheduleRow from "./PresetScheduleRow";
import { PresetScheduleItem } from "./types";

type Props = {
  schedule: PresetScheduleItem[];
  onUpdate: (id: string, start: string, end: string) => void;
  onDelete: (id: string) => void;
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

export default function PresetScheduleTable({
  schedule,
  onUpdate,
  onDelete,
}: Props) {
  return (
    <DataTable
      headers={[
        "Day",
        "Kitchen",
        "Start",
        "End",
        "",
      ]}
      empty={schedule.length === 0}
      emptyMessage="No recurring schedule configured."
    >
      {schedule.map((item) => (
        <PresetScheduleRow
          key={item.id}
          item={item}
          dayLabel={weekdays[item.weekday]}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </DataTable>
  );
}