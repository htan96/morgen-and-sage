"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

    /*
    -----------------------------
    Get logged in user
    -----------------------------
    */

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    /*
    -----------------------------
    Check tenant table
    -----------------------------
    */

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    /*
    -----------------------------
    Route correctly
    -----------------------------
    */

    if (tenant) {
      router.replace("/portal");
    } else {
      router.replace("/admin/bookings");
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md">

      <img
  src="/logos/morgens-kitchen-dark.svg"
  className="h-12 mx-auto mb-6"
/>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

      </div>

    </div>
  );
}