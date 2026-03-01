"use client";

import { useEffect, useState } from "react";
import TopBar from "./TopBar";
import KitchenCards from "./KitchenCards";
import CheckInPanel from "./CheckInPanel";
import LiveFeed from "./LiveFeed";

export default function KioskShell() {
  const [now, setNow] = useState(new Date());

  // Clock update every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto full reload every 5 minutes
  useEffect(() => {
    const reloadInterval = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(reloadInterval);
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

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "24px 24px 32px 24px",
          gap: 32,
        }}
      >
        <KitchenCards />

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
          }}
        >
          <CheckInPanel />
        </div>

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