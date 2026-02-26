"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isDark, setIsDark] = useState(false);
  const [initials, setInitials] = useState("MS");
  const [role, setRole] = useState<string | null>(null);

  /* -----------------------------
     Theme Logic
  ------------------------------ */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;

    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  /* -----------------------------
     Auth + Role Fetch
  ------------------------------ */
  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (user.email) {
        const name = user.email.split("@")[0];
        setInitials(name.slice(0, 2).toUpperCase());
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setRole(data?.role ?? null);
    };

    getUserData();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* -----------------------------
     Navigation
  ------------------------------ */

  const baseNav = [
    { name: "Bookings", href: "/admin/bookings" },
    { name: "Invoices", href: "/admin/invoices" },
  ];

  const adminNav = [
    { name: "Tenants", href: "/admin/tenants" },
    { name: "Activity", href: "/admin/activity" },
    { name: "Documents", href: "/admin/documents" },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* TOP SECTION */}
      <div className="flex-1">

        {/* LOGO */}
    <div
  className="p-6 flex items-center justify-center"
  style={{
    borderBottom: "1px solid var(--sidebar-border)",
  }}
>
  {isDark ? (
    <img
      src="/logos/morgens-kitchen-light.svg"
      alt="Morgen's Kitchen"
      className="h-12 w-auto object-contain"
    />
  ) : (
    <img
      src="/logos/morgens-kitchen-dark.svg"
      alt="Morgen's Kitchen"
      className="h-12 w-auto object-contain"
    />
  )}
</div>

        {/* NAV */}
        <nav className="p-4 space-y-2">
          {baseNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 rounded-lg transition"
              style={{
                background: pathname.startsWith(item.href)
                  ? "var(--sidebar-hover)"
                  : "transparent",
              }}
            >
              {item.name}
            </Link>
          ))}

          {role === "admin" &&
            adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 rounded-lg transition"
                style={{
                  background: pathname.startsWith(item.href)
                    ? "var(--sidebar-hover)"
                    : "transparent",
                }}
              >
                {item.name}
              </Link>
            ))}
        </nav>
      </div>

      {/* BOTTOM SECTION */}
      <div
        className="p-4 space-y-4"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition"
          style={{ background: "var(--sidebar-hover)" }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        <div
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ background: "var(--sidebar-hover)" }}
        >
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
            {initials}
          </div>
          <div style={{ color: "var(--text-muted)" }}>
            {role ?? "Loading..."}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full px-4 py-2 rounded-lg bg-black text-white hover:opacity-80 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}