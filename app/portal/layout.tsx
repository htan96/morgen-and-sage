import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  /* ---------------- Auth ---------------- */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /* ---------------- Tenant ---------------- */

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!tenant) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex fixed left-0 top-0 h-screen">
        <Sidebar variant="full" />
      </div>

      <MobileSidebar />

      <main className="flex-1 md:ml-64 ml-14 px-2 sm:px-4 md:px-6 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}