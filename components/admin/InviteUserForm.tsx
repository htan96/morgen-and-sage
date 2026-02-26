"use client";

import { useState } from "react";

export default function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    setLoading(true);

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error);
    } else {
      alert("User invited successfully");
      setEmail("");
    }

    setLoading(false);
  };

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <h2 className="text-lg font-semibold mb-4">
        Invite New User
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 rounded-lg mb-4"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full px-4 py-2 rounded-lg mb-4"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      <button
        onClick={handleInvite}
        disabled={loading}
        className="w-full py-2 rounded-lg font-medium"
        style={{
          background: "var(--text)",
          color: "var(--bg)",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Inviting..." : "Invite User"}
      </button>
    </div>
  );
}