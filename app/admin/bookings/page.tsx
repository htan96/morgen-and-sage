import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import AdminBookingsClient from "./AdminBookingsClient";

const ORG_ID = "49c3ef02-cb09-4fde-82d8-2012e5945ba2";

export default async function AdminBookingsPage() {
  /* ---------------- Kitchens ---------------- */

  const { data: kitchens, error: kitchensError } = await supabaseAdmin
    .from("kitchen_spaces")
    .select("id, name")
    .eq("organization_id", ORG_ID)
    .order("name");

  if (kitchensError) {
    console.error("KITCHENS ERROR:", kitchensError);
  }

  /* ---------------- Bookings (include joins) ---------------- */

  const { data: bookings, error: bookingsError } = await supabaseAdmin
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
      ),
      kitchen:kitchen_spaces (
        id,
        name
      )
    `)
    .eq("organization_id", ORG_ID);

  if (bookingsError) {
    console.error("BOOKINGS ERROR:", bookingsError);
  }

  /* ---------------- Tenants ---------------- */

  const { data: tenants, error: tenantsError } = await supabaseAdmin
    .from("tenants")
    .select("id, name")
    .eq("organization_id", ORG_ID)
    .order("name");

  if (tenantsError) {
    console.error("TENANTS ERROR:", tenantsError);
  }

  /* ---------------- Normalize joins ---------------- */

  const normalizedBookings =
    bookings?.map((b: any) => ({
      ...b,
      tenant: Array.isArray(b.tenant) ? b.tenant[0] ?? null : b.tenant ?? null,
      kitchen: Array.isArray(b.kitchen)
        ? b.kitchen[0] ?? null
        : b.kitchen ?? null,
    })) ?? [];

  /* ---------------- Render ---------------- */

  return (
    <AdminBookingsClient
      kitchens={kitchens ?? []}
      bookings={normalizedBookings}
      tenants={tenants ?? []}
      organizationId={ORG_ID}
    />
  );
}