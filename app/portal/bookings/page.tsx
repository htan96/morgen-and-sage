import { createClient } from "@/lib/supabase/server";
import AdminBookingsClient from "@/app/admin/bookings/AdminBookingsClient";

export default async function PortalBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  /* Get tenant linked to this user */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!tenant) return null;

  const orgId = tenant.organization_id;

  /* Kitchens */

  const { data: kitchens } = await supabase
    .from("kitchen_spaces")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name");

  /* Bookings (RLS will limit what tenant can see) */
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
    ),
    kitchen:kitchen_spaces (
      id,
      name
    )
  `)
  .eq("organization_id", orgId)
  
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
      tenants={[]}              // tenants hidden in portal
      organizationId={orgId}
      tenantIdFromPortal={tenant.id}
      portalMode={true}
    />
  );
}