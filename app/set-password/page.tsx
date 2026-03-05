"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* -------------------------------- */
  /* Ensure recovery session exists   */
  /* -------------------------------- */

useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      router.push("/login");
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, [router, supabase]);
  /* -------------------------------- */
  /* Set Password                     */
  /* -------------------------------- */

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    /*
    Optional but recommended:
    Clear must_reset_password
    */

    await fetch("/api/auth/password-updated", {
      method: "POST",
    });

    /*
    Redirect user to portal
    */

    router.push("/portal");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSetPassword}
        className="w-full max-w-md p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4"
      >
        <h1 className="text-xl font-semibold">
          Set Your Password
        </h1>

        <input
          type="password"
          placeholder="New password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-[var(--text)] text-[var(--bg)]"
        >
          {loading ? "Saving..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}
