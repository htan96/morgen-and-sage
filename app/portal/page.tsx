import { createClient } from "@/lib/supabase/server";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h2>Portal Page Loaded</h2>
      <p>User: {user?.id}</p>
    </div>
  );
}