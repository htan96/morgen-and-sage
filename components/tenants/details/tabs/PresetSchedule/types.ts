export type PresetScheduleItem = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  kitchen_spaces: { name: string } | null;
};