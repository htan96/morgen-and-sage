import { createClient } from "@/lib/supabase/server";
import AdminBookingsClient from "./AdminBookingsClient";

const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  // Kitchens
  const { data: kitchens } = await supabase
    .from("kitchen_spaces")
    .select("id, name")
    .eq("organization_id", ORG_ID)
    .order("name");

  // Bookings (with tenant relation)
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      kitchen_space_id,
      start_time,
      end_time,
      tenant_id,
      tenant:tenants (
        id,
        name
      )
    `)
    .eq("organization_id", ORG_ID);

  // Tenants (for dropdown panel)
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("organization_id", ORG_ID)
    .order("name");

  // 🔥 NORMALIZE tenant (Supabase returns array sometimes)
  const normalizedBookings =
    bookings?.map((b: any) => ({
      ...b,
      tenant: Array.isArray(b.tenant)
        ? b.tenant[0] ?? null
        : b.tenant ?? null,
    })) ?? [];

  return (
    <AdminBookingsClient
      kitchens={kitchens ?? []}
      bookings={normalizedBookings}
      tenants={tenants ?? []}
    />
  );
}