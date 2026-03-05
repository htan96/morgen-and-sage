"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InviteSetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const token = params.token as string;

  const [email, setEmail] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
  --------------------------------
  Load invite data
  --------------------------------
  */

  useEffect(() => {

    if (!token) return;

    async function loadInvite() {

      setLoading(true);

      const res = await fetch("/api/invites/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Invalid invite");
        router.push("/login");
        return;
      }

      setEmail(data.email);
      setTenantId(data.tenantId);
      setLoading(false);
    }

    loadInvite();

  }, [token, router]);

  /*
  --------------------------------
  Create account
  --------------------------------
  */

  async function handleCreateAccount(e: React.FormEvent) {

    e.preventDefault();
    setSaving(true);

    let { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "tenant",
          tenant_id: tenantId,
        },
      },
    });

    /*
    --------------------------------
    Handle existing user
    --------------------------------
    */

    if (error && error.message.includes("User already registered")) {

      const login = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (login.error) {
        alert(login.error.message);
        setSaving(false);
        return;
      }

      data = login.data;
    }

    if (error && !error.message.includes("User already registered")) {
      alert(error.message);
      setSaving(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      alert("Account created but user ID missing.");
      setSaving(false);
      return;
    }

    /*
    --------------------------------
    Ensure session exists
    --------------------------------
    */

    await supabase.auth.refreshSession();

    /*
    --------------------------------
    Link tenant + mark invite used
    --------------------------------
    */

    const consumeRes = await fetch("/api/invites/consume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        userId,
      }),
    });

    const consumeData = await consumeRes.json();

    if (!consumeRes.ok) {
      alert(consumeData.error || "Failed to complete invite");
      setSaving(false);
      return;
    }

    /*
    --------------------------------
    Redirect
    --------------------------------
    */

    router.replace("/");
  }

  /*
  --------------------------------
  Loading state
  --------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading invite...
      </div>
    );
  }

  /*
  --------------------------------
  Page UI
  --------------------------------
  */

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">

      <form
        onSubmit={handleCreateAccount}
        className="w-full max-w-md p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4"
      >

        <h1 className="text-xl font-semibold text-[var(--text)]">
          Set Your Password
        </h1>

        <div className="text-sm text-[var(--text-muted)]">
          Account for:
          <span className="font-medium text-[var(--text)] ml-1">
            {email}
          </span>
        </div>

        <input
          type="password"
          placeholder="Create password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[var(--text)] text-[var(--bg)] font-medium disabled:opacity-60"
        >
          {saving ? "Creating Account..." : "Create Account"}
        </button>

      </form>

    </div>
  );
}