"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Compact rail */}
      <div className="md:hidden fixed left-0 top-0 h-screen z-40">
        <Sidebar variant="compact" />
        <button
          onClick={() => setOpen(true)}
          className="absolute top-4 right-[-12px] bg-black text-white w-6 h-6 rounded-full text-xs"
        >
          →
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Expanded drawer */}
      <div
        className={`fixed top-0 left-0 h-screen z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <Sidebar variant="full" />
      </div>
    </>
  );
}