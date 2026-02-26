import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  if (!profile || profile.role !== "admin") redirect("/dashboard");

return (
  <div className="min-h-screen">
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800">
      <Sidebar />
    </div>

    <main className="ml-64 p-8 min-h-screen">
      {children}
    </main>
  </div>
);
}