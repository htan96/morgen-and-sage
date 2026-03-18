import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, must_reset_password")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (tenant?.must_reset_password) redirect("/set-password");
  if (tenant) redirect("/portal");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") redirect("/admin/bookings");

  redirect("/login");
}
