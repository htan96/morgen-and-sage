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

  /* ----------------------------- */
  /* Auth Check                    */
  /* ----------------------------- */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  /* ----------------------------- */
  /* Prevent Admin Access          */
  /* ----------------------------- */

  if (profile.role === "admin") {
    redirect("/admin");
  }

  /* ----------------------------- */
  /* Layout                        */
  /* ----------------------------- */

  return (
    <div className="flex min-h-screen">

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen">
        <Sidebar variant="full" />
      </div>

      {/* Mobile Sidebar */}
      <div>
        <MobileSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 ml-14 px-2 sm:px-4 md:px-6 py-4 md:py-6">
        {children}
      </main>

    </div>
  );
}