"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tenantId: string;
  email: string | null;
};

export default function CreatePortalUserButton({ tenantId, email }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          email: email.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create invite.");
        return;
      }

      const inviteLink = data.inviteLink;

      // Copy invite link
      if (inviteLink) {
        await navigator.clipboard.writeText(inviteLink);
      }

      console.log("Gmail response:", data.gmailResult);

      alert(
        `Portal invite sent successfully.\n\nInvite link copied to clipboard.`
      );

      // refresh UI if needed
      router.refresh();
    } catch (err) {
      console.error("Invite failed:", err);
      alert("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCreatePortalUser}
      disabled={loading}
      className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] transition text-sm disabled:opacity-50"
    >
      {loading ? "Sending Invite..." : "Send Portal Invite"}
    </button>
  );
}