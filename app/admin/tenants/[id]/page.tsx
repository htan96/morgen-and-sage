import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TenantView from "@/components/tenants/TenantView";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ required in Next 15

  const supabase = await createClient();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  console.log("TENANT:", tenant);
  console.log("ERROR:", error);

  if (!tenant) {
    notFound();
  }

  return <TenantView tenant={tenant} />;
}