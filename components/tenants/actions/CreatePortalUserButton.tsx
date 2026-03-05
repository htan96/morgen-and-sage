"use client";

import { useState } from "react";

type Props = {
  tenantId: string;
  email: string | null;
};

export default function CreatePortalUserButton({
  tenantId,
  email,
}: Props) {

  const [loading, setLoading] = useState(false);

  async function handleCreatePortalUser() {

    if (!email) {
      alert("Tenant must have an email first.");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch("/api/tenants/create-portal-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create portal login");
        return;
      }

      alert(
        `Portal account created.\n\nTemporary Password:\n${data.tempPassword}\n\nSend this to the tenant.`
      );

    } catch (err) {

      console.error(err);
      alert("Failed to create portal login");

    } finally {

      setLoading(false);

    }
  }

  return (
    <button
      onClick={handleCreatePortalUser}
      disabled={loading}
      className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] transition text-sm"
    >
      {loading ? "Creating..." : "Send Portal Invite"}
    </button>
  );
}