"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorState("No authenticated user.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          setErrorState(error.message);
        } else {
          setProfile(data);
        }
      } catch (err: any) {
        setErrorState("Unexpected error.");
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="p-10">Loading...</div>;

  if (errorState)
    return <div className="p-10 text-red-500">Error: {errorState}</div>;

  if (!profile)
    return (
      <div className="p-10">
        No profile found for this user. You likely need to create one.
      </div>
    );

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Role: {profile.role}</p>
      <p>Organization: {profile.organization_id}</p>
      <p>Tenant: {profile.tenant_id ?? "Admin account"}</p>
    </div>
  );
}