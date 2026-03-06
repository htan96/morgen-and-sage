export type Booking = {
  id: string
  tenant_id: string
  kitchen_space_id: string
  start_time: string
  end_time: string

  tenant?: {
    id: string
    name: string
  } | null

  kitchen?: {
    id: string
    name: string
  } | null
}