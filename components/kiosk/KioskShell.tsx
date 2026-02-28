"use client";

import { useEffect, useState } from "react";
import TopBar from "./TopBar";
import KitchenCards from "./KitchenCards";
import CheckInPanel from "./CheckInPanel";
import LiveFeed from "./LiveFeed";

export default function KioskShell() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <TopBar now={now} />

      {/* Main Portrait Layout */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "24px 24px 32px 24px",
          gap: 32,
        }}
      >
        {/* Kitchen Status */}
        <KitchenCards />

        {/* Check-In Section */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
          }}
        >
          <CheckInPanel />
        </div>

        {/* Live Feed */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
          }}
        >
          <LiveFeed now={now} />
        </div>
      </div>
    </div>
  );
}