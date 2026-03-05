"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Calendar, FileText, Users, Activity, File, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SidebarProps = {
  variant?: "full" | "compact";
};

export default function Sidebar({ variant = "full" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isDark, setIsDark] = useState(false);
  const [initials, setInitials] = useState("MS");
  const [role, setRole] = useState<string | null>(null);

  const isCompact = variant === "compact";

  /* ---------------- Theme ---------------- */

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    const darkMode = html.classList.contains("dark");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    setIsDark(darkMode);
  };

  /* ---------------- Auth ---------------- */

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

  /* ---------------- Nav ---------------- */

  const navItems = [
    { name: "Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "Invoices", href: "/admin/invoices", icon: FileText },
    { name: "Tenants", href: "/admin/tenants", icon: Users, admin: true },
    { name: "Activity", href: "/admin/activity", icon: Activity, admin: true },
    { name: "Documents", href: "/admin/documents", icon: File, admin: true },
    { name: "Users", href: "/admin/users", icon: Shield, admin: true },
  ];

  return (
    <aside
      className={`h-screen flex flex-col ${
        isCompact ? "w-14 items-center" : "w-64"
      }`}
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      {!isCompact && (
        <div
          className="p-6 flex items-center justify-center"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <img
            src={
              isDark
                ? "/logos/morgens-kitchen-light.svg"
                : "/logos/morgens-kitchen-dark.svg"
            }
            alt="Morgen's Kitchen"
            className="h-12"
          />
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 p-2 space-y-2`}>
        {navItems.map((item) => {
          if (item.admin && role !== "admin") return null;

          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${
                isCompact ? "justify-center" : "gap-3"
              } px-3 py-2 rounded-lg transition`}
              style={{
                background: active
                  ? "var(--sidebar-hover)"
                  : "transparent",
              }}
            >
              <Icon size={18} />
              {!isCompact && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      {!isCompact && (
        <div
          className="p-4 space-y-4"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: "var(--sidebar-hover)" }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

    <Link
      href="/admin/settings"
      className="flex items-center gap-3 p-3 rounded-lg transition cursor-pointer"
      style={{ background: "var(--sidebar-hover)" }}
    >
      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
        {initials}
      </div>

      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium">
          {role ?? "Loading"}
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Settings
        </span>
      </div>
    </Link>

          <button
            onClick={logout}
            className="w-full px-4 py-2 rounded-lg bg-black text-white"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}