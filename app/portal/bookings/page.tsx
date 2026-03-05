import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminBookingsClient from "@/app/admin/bookings/AdminBookingsClient";

export default async function PortalBookingsPage() {
  const supabase = await createClient();

  /* ---------------- Auth ---------------- */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /* ---------------- Tenant ---------------- */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, organization_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!tenant) redirect("/login");

  const tenantId = tenant.id;

  /* ---------------- Kitchens ---------------- */

  const { data: kitchens } = await supabase
    .from("kitchen_spaces")
    .select("id, name")
    .eq("organization_id", tenant.organization_id)
    .order("name");

  /* ---------------- Bookings ---------------- */

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
    .eq("tenant_id", tenantId);

  /* ---------------- Normalize Supabase Relation ---------------- */

  const normalizedBookings =
    bookings?.map((b: any) => ({
      ...b,
      tenant: Array.isArray(b.tenant)
        ? b.tenant[0] ?? null
        : b.tenant ?? null,
    })) ?? [];

  /* ---------------- Render ---------------- */

  return (
    <AdminBookingsClient
      kitchens={kitchens ?? []}
      bookings={normalizedBookings}
      tenants={[tenant]}
      portalMode
    />
  );
}