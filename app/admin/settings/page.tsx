import { createClient } from "@/lib/supabase/server";
import SettingsLayout from "@/components/settings/SettingsLayout";
import EmailIntegrationCard from "@/components/settings/EmailIntegrationCard";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  /* ---------------- Current User Profile ---------------- */

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!myProfile) {
    return null;
  }

  /* ---------------- Organization Sender Profile ---------------- */
  /* This finds the profile in the organization that connected Gmail */

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", myProfile.organization_id)
    .not("google_refresh_token", "is", null)
    .maybeSingle();

  return (
    <SettingsLayout
      title="Settings"
      description="Manage organization integrations and configuration."
    >
      <EmailIntegrationCard profile={senderProfile} />
    </SettingsLayout>
  );
}