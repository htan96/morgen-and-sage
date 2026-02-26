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

      <div
        style={{
          padding: "24px 40px 0 40px",
        }}
      >
        <KitchenCards />
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          padding: "32px 40px 40px 40px",
          gap: 32,
        }}
      >
        <CheckInPanel />
        <LiveFeed now={now} />
      </div>
    </div>
  );
}