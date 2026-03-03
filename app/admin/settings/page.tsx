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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <SettingsLayout
      title="Settings"
      description="Manage organization integrations and configuration."
    >
      <EmailIntegrationCard profile={profile} />
    </SettingsLayout>
  );
}