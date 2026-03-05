import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  /* ----------------------------- */
  /* Get Draft Invoice Count       */
  /* ----------------------------- */

  const { count: draftCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  return (
    <div className="flex min-h-screen print:block">

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen print:hidden">
        <Sidebar variant="full" />
      </div>

      {/* Mobile Sidebar */}
      <div className="print:hidden">
        <MobileSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 ml-14 px-2 sm:px-4 md:px-6 py-4 md:py-6 print:ml-0 print:px-0 print:py-0">

        {/* Draft Invoice Alert */}
        {draftCount && draftCount > 0 && (
          <div
            className="mb-6 rounded-xl p-4 flex justify-between items-center"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <strong>
                {draftCount} invoice{draftCount > 1 ? "s" : ""} need review
              </strong>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Draft invoices must be reviewed before sending.
              </div>
            </div>

            <Link
              href="/admin/invoices?status=draft"
              className="px-3 py-2 rounded-lg"
              style={{
                background: "var(--hover)",
                border: "1px solid var(--border)",
              }}
            >
              Review
            </Link>
          </div>
        )}

        {children}

      </main>
    </div>
  );
}