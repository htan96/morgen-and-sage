"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* -------------------------------- */
  /* Check if user already logged in  */
  /* -------------------------------- */

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) return;

      const user = data.session.user;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, must_reset_password")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (tenant?.must_reset_password) {
        router.replace("/set-password");
        return;
      }

      if (tenant) {
        router.replace("/portal");
      } else {
        router.replace("/admin/bookings");
      }
    }

    checkSession();
  }, []);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        Morgen & Sage
      </h1>

      <p className="text-gray-500 text-center mb-8">
        Secure Admin & Tenant Access
      </p>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}