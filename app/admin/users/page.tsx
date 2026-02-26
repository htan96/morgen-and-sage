import { createClient } from "@/lib/supabase/server";
import InviteUserForm from "@/components/admin/InviteUserForm";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">User Management</h1>

      <InviteUserForm />

      <div className="mt-10">
        <h2 className="text-lg font-medium mb-4">Existing Users</h2>

        <div className="space-y-3">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex justify-between border p-4 rounded-lg"
            >
              <span>{user.id}</span>
              <span className="font-medium">{user.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}