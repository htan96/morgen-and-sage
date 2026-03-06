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

  /* -------------------------------- */
  /* Get current user profile         */
  /* -------------------------------- */

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!myProfile) return null;

  /* -------------------------------- */
  /* Get organization email sender    */
  /* -------------------------------- */

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", myProfile.organization_id)
    .eq("is_email_sender", true)
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