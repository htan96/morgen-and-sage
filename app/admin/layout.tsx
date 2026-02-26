"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPrintPage =
    pathname?.endsWith("/pdf") ||
    pathname?.includes("/reports/statement");

  return (
    <div
      className="min-h-screen"
      style={{
        background: isPrintPage ? "white" : "var(--bg)",
      }}
    >
      {/* Hide Sidebar on print pages */}
      {!isPrintPage && (
        <div className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800">
          <Sidebar />
        </div>
      )}

      <main
        className={`min-h-screen ${
          !isPrintPage ? "ml-64 p-8" : "p-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
}