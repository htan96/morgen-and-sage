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

  // Not logged in → send to login
  if (!user) {
    redirect("/login");
  }

  // Get role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // Not admin → block access
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800">
        <Sidebar />
      </div>

      <main className="ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}