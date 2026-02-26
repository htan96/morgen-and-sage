import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MobileSidebar from "@/components/MobileSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin")
    redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen">
        <Sidebar variant="full" />
      </div>

      {/* Mobile Sidebar (Compact Rail + Drawer) */}
      <MobileSidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 ml-14 px-2 sm:px-4 md:px-6 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}