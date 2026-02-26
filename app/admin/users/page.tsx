import { createClient } from "@/lib/supabase/server";
import InviteUserForm from "@/components/admin/InviteUserForm";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">
          User Management
        </h1>
      </div>

      {/* Invite Form */}
      <div>
        <InviteUserForm />
      </div>

      {/* Existing Users */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">
          Existing Users
        </h2>

        <div className="space-y-3">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border border-[var(--border)] bg-[var(--surface)] p-4 rounded-lg"
            >
              <span className="text-xs sm:text-sm break-all text-[var(--text-muted)]">
                {user.id}
              </span>

              <span className="font-medium text-[var(--text)]">
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}