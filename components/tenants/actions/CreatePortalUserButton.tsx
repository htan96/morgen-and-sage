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
      const res = await fetch("/api/tenants/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          email,
        }),
      });

      const text = await res.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server returned HTML:", text);
        alert("Server error — check API route");
        return;
      }

      if (!res.ok) {
        alert(data.error || "Failed to create invite");
        return;
      }

      const inviteLink = data.inviteLink;

      // copy invite link automatically
      await navigator.clipboard.writeText(inviteLink);

      alert(
        `Invite created.\n\nLink copied to clipboard:\n\n${inviteLink}`
      );

    } catch (err) {
      console.error(err);
      alert("Failed to create invite");
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