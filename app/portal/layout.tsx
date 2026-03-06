import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="flex min-h-screen">

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar variant="full" />
      </div>

      {/* Page Area */}
      <div className="flex-1 flex flex-col">

        {/* Mobile Header + Sidebar Trigger */}
        <MobileSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>

      </div>
    </div>
  );
}