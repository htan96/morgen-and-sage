export type Booking = {
  id: string;
  kitchen_space_id: string;
  start_time: string;
  end_time: string;
  tenant_id: string;
  tenant: {
    id: string;
    name: string;
  } | null;
};